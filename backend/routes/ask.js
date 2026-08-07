// ============================================================
// routes/ask.js -> POST /api/ask
// ============================================================
// Flow:
//  Phase 1 - SQL generation (max 3 attempts, self-correcting):
//    Call 1: system(schema) + user(question) -> SQL
//    On DB error: append error to conversation -> AI fixes SQL (no schema re-send)
//  Phase 2 - Natural language (only for single scalar results):
//    Short separate call: system(tiny prompt) + user(Q + value) -> Thai sentence
// ============================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const pool = require('../db/pool');

// ---- DeepSeek client (OpenAI-compatible) ----
function createClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 15000, // 15 วินาที timeout ป้องกันหมุนค้าง
  });
}

// ---- Load schema ----
const SCHEMA_PATH = path.join(__dirname, '../data/database_schema.txt');

function loadSchema() {
  try {
    return fs.readFileSync(SCHEMA_PATH, 'utf-8').trim();
  } catch {
    return '(schema not found)';
  }
}

// ---- Retry with exponential backoff (for 429 rate limit) ----
async function retryWithBackoff(fn, maxRetries = 3) {
  let delay = 3000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.status === 429;
      if (!isRateLimit || attempt === maxRetries) throw err;
      console.warn(`[ask] DeepSeek 429 - retry ${attempt}/${maxRetries} in ${delay / 1000}s`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// ---- Dangerous keywords (write operations) ----
const DANGEROUS_KEYWORDS = [
  'DELETE', 'DROP', 'UPDATE', 'INSERT', 'TRUNCATE',
  'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'EXECUTE',
  'EXEC', 'CALL', 'MERGE', 'REPLACE', 'RENAME',
];

function validateSQL(sql) {
  const upper = sql.toUpperCase().trim();
  if (!upper.startsWith('SELECT')) {
    return { safe: false, reason: 'คำสั่ง SQL ต้องขึ้นต้นด้วย SELECT เท่านั้น' };
  }
  for (const kw of DANGEROUS_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(sql)) {
      return { safe: false, reason: `ตรวจพบคำสั่งต้องห้าม: ${kw}` };
    }
  }
  const parts = sql.split(';').map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return { safe: false, reason: 'ไม่อนุญาตให้รันหลายคำสั่งพร้อมกัน' };
  }
  return { safe: true };
}

function extractSQL(text) {
  const fenced = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const lines = text.trim().split('\n');
  const selectIdx = lines.findIndex(l => /^\s*SELECT/i.test(l));
  if (selectIdx >= 0) return lines.slice(selectIdx).join('\n').trim();
  return text.trim();
}

// ============================================================
// POST /api/ask  { question: string }
// ============================================================
router.post('/', async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'กรุณาระบุคำถาม (question)' });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า DEEPSEEK_API_KEY ใน .env' });
    }

    const schema = loadSchema();
    const today = new Date().toISOString().slice(0, 10);
    const client = createClient();

    // ================================================================
    // Phase 1: SQL generation + self-correction (max 3 attempts)
    // Schema sent once in system message only.
    // On SQL error -> append error to conversation (no schema re-send)
    // Token saving: correction retries cost ~30 tokens instead of ~250
    // ================================================================
    const MAX_ATTEMPTS = 3;
    const messages = [
      {
        role: 'system',
        content: `Reply PostgreSQL SELECT only. No markdown. If unanswerable: SELECT 'No' AS message
Schema:
${schema}
Today:${today}`,
      },
      { role: 'user', content: question.trim() },
    ];

    let sql = '';
    let dbResult = null;
    let lastSQLError = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Call AI for SQL
      const completion = await retryWithBackoff(() =>
        client.chat.completions.create({
          model: 'deepseek-chat',
          temperature: 0,
          max_tokens: 512,
          messages,
        })
      );

      const rawSQL = completion.choices[0]?.message?.content || '';
      sql = extractSQL(rawSQL);

      // Append AI response to conversation (for self-correction next round)
      messages.push({ role: 'assistant', content: rawSQL });

      // Safety check
      const check = validateSQL(sql);
      if (!check.safe) {
        return res.status(422).json({ error: `SQL ไม่ปลอดภัย: ${check.reason}`, generatedSQL: sql });
      }

      // Run SQL against real DB
      try {
        dbResult = await pool.query(sql);
        break; // success - exit loop
      } catch (sqlErr) {
        lastSQLError = sqlErr.message;
        console.warn(`[ask] SQL error attempt ${attempt}/${MAX_ATTEMPTS}:`, lastSQLError);

        if (attempt < MAX_ATTEMPTS) {
          // Ask AI to fix - no schema re-send needed (already in system message)
          // This correction message costs only ~30 tokens instead of ~250
          messages.push({
            role: 'user',
            content: `SQL error: ${lastSQLError}\nFix the SQL. Reply with corrected SELECT only, no explanation.`,
          });
        }
      }
    }

    // All attempts failed
    if (!dbResult) {
      return res.status(422).json({
        error: 'ขออภัย ไม่สามารถสร้าง SQL ที่ถูกต้องได้ในขณะนี้',
      });
    }

    // ================================================================
    // Phase 2: Natural language conversion
    // ขยายให้รองรับข้อมูลขนาดเล็ก (ไม่เกิน 5 แถว) เพื่อแปลงเป็นภาษาคน
    // เช่น "หมวดหมู่ไหนใช้มากสุด" หรือ "5 รายการล่าสุด"
    // ================================================================
    let naturalLanguage = null;

    const isSmallResult = dbResult.rows.length > 0 && dbResult.rows.length <= 5;
    const isCannotAnswer = dbResult.rows.length === 1 &&
      dbResult.fields[0]?.name === 'message' &&
      String(Object.values(dbResult.rows[0])[0]).includes('ไม่สามารถ');

    if (isSmallResult && !isCannotAnswer) {
      const dataStr = JSON.stringify(dbResult.rows);
      try {
        const nlCompletion = await retryWithBackoff(() =>
          client.chat.completions.create({
            model: 'deepseek-chat',
            temperature: 0.3,
            max_tokens: 150,  
            messages: [
              {
                role: 'system',
                content: '1 short Thai sentence summarizing this data. Baht currency. No markdown.',
              },
              {
                role: 'user',
                content: `Q:${question.trim()}\nData:${dataStr}`,
              },
            ],
          })
        );
        naturalLanguage = nlCompletion.choices[0]?.message?.content?.trim() || null;
      } catch (nlErr) {
        console.warn('[ask] NL conversion failed (non-critical):', nlErr.message);
      }
    }

    res.json({
      question: question.trim(),
      sql,
      columns: dbResult.fields.map(f => f.name),
      rows: dbResult.rows,
      rowCount: dbResult.rowCount,
      naturalLanguage,  // null for tables, string for scalar results
    });

  } catch (err) {
    if (err.status) {
      let msg = 'DeepSeek API error';
      if (err.status === 429) msg = 'เกินโควต้า DeepSeek API — รอสักครู่แล้วลองใหม่';
      else if (err.status === 401) msg = 'DEEPSEEK_API_KEY ไม่ถูกต้อง — ตรวจสอบ key ใน .env';
      else if (err.status === 402) msg = 'DeepSeek: เครดิตหมด — เติมเงินที่ platform.deepseek.com';
      else if (err.status === 400) msg = `DeepSeek ปฏิเสธ request: ${err.message}`;
      else msg = `DeepSeek API error (${err.status}): ${err.message}`;
      return res.status(502).json({ error: msg });
    }
    next(err);
  }
});

module.exports = router;
