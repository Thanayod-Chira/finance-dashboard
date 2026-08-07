// ============================================================
// pages/AiChat.jsx — หน้าผู้ช่วย AI (กล่องแชทสไตล์ ChatGPT)
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { askAI } from '../api/client';

// ตัวอย่างคำถาม (quick chips)
const QUICK_QUESTIONS = [
  'เดือนนี้ใช้เงินไปเท่าไหร่',
  'หมวดหมู่ไหนใช้มากสุดเดือนนี้',
  '5 รายการใช้จ่ายล่าสุด',
  'รายรับเดือนนี้มีเท่าไหร่',
  'เงินออมในเป้าหมายทั้งหมดเป็นเท่าไหร่',
  'บิลไหนยังไม่ได้จ่ายอัตโนมัติ',
];

// ---- Typing indicator ----
function TypingDots() {
  return (
    <div className="bubble bubble--ai bubble--typing" aria-label="กำลังคิด...">
      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
    </div>
  );
}

// ---- Result table ----
function ResultTable({ columns, rows }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <div className="result-table-wrap">
      <table className="result-table">
        <thead>
          <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col} className="mono">
                  {row[col] === null ? <span className="null-val">null</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- SQL reveal (collapsible) ----
function SqlReveal({ sql }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sql-reveal">
      <button className="sql-toggle" onClick={() => setOpen(o => !o)}>
        <span className="sql-toggle-icon">{open ? '▾' : '▸'}</span> ดู SQL ที่รัน
      </button>
      {open && <pre className="sql-code mono">{sql}</pre>}
    </div>
  );
}

// ---- Single message bubble ----
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="chat-row chat-row--user">
        <div className="bubble bubble--user">{msg.content}</div>
      </div>
    );
  }

  // AI bubble
  const isCannotAnswer = msg.rows?.length === 1 &&
    msg.columns?.length === 1 &&
    msg.columns[0] === 'message' &&
    String(msg.rows[0]?.message || '').includes('ไม่สามารถ');

  return (
    <div className="chat-row chat-row--ai">
      <div className="bubble-avatar">✦</div>
      <div className="bubble-ai-wrap">
        {msg.error ? (
          <div className="bubble bubble--ai bubble--error">
            <span className="bubble-error-icon">⚠</span> {msg.error}
          </div>
        ) : (
          <div className="bubble bubble--ai">
            {/* Natural language answer (single scalar result) */}
            {msg.naturalLanguage && (
              <p style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                margin: '0 0 0.75rem 0',
                lineHeight: 1.5,
              }}>
                {msg.naturalLanguage}
              </p>
            )}

            {/* Cannot answer message */}
            {isCannotAnswer && (
              <p className="no-result">💬 {msg.rows[0].message}</p>
            )}

            {/* Table (multi-row results or when no NL available) */}
            {!isCannotAnswer && !msg.naturalLanguage && (
              msg.rows?.length === 0
                ? <p className="no-result">ไม่พบข้อมูลที่ตรงกับคำถาม</p>
                : <ResultTable columns={msg.columns} rows={msg.rows} />
            )}

            {msg.sql && <SqlReveal sql={msg.sql} />}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// Main Component
// ============================================================
export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll ลงล่างเสมอเมื่อมี message ใหม่
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendQuestion(q) {
    const question = (q || input).trim();
    if (!question || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const data = await askAI(question);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          sql: data.sql,
          columns: data.columns,
          rows: data.rows,
          rowCount: data.rowCount,
          naturalLanguage: data.naturalLanguage || null,
        },
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setMessages(prev => [...prev, { role: 'ai', error: errMsg }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  }

  return (
    <div className="ai-chat-page">
      {/* ---- Header ---- */}
      <div className="page-header">
        <div>
          <h1>✦ ผู้ช่วย AI</h1>
          <p className="page-sub">ถามเป็นภาษาไทยธรรมดา AI จะแปลงเป็น SQL และดึงข้อมูลให้อัตโนมัติ</p>
        </div>
      </div>

      {/* ---- Chat area ---- */}
      <div className="chat-container">
        <div className="chat-messages" id="chat-messages">

          {/* Welcome state */}
          {messages.length === 0 && !loading && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">✦</div>
              <h2>สวัสดี! ฉันคือผู้ช่วย AI ด้านการเงิน</h2>
              <p>ถามฉันเกี่ยวกับข้อมูลการเงินของคุณได้เลย</p>
              <div className="quick-chips">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    className="quick-chip"
                    onClick={() => sendQuestion(q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-row chat-row--ai">
              <div className="bubble-avatar">✦</div>
              <TypingDots />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ---- Quick chips (แสดงหลังมีข้อความแล้ว) ---- */}
        {messages.length > 0 && (
          <div className="quick-chips quick-chips--bottom">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                className="quick-chip"
                onClick={() => sendQuestion(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ---- Input bar ---- */}
        <div className="chat-input-bar">
          <textarea
            ref={inputRef}
            id="ai-chat-input"
            className="chat-input mono"
            rows={2}
            placeholder="พิมพ์คำถามที่นี่... เช่น 'เดือนนี้ใช้เงินไปเท่าไหร่' (กด Enter เพื่อส่ง)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            id="ai-chat-send"
            className="chat-send-btn"
            onClick={() => sendQuestion()}
            disabled={loading || !input.trim()}
            aria-label="ส่งคำถาม"
          >
            {loading ? <span className="send-spin">↻</span> : '↑'}
          </button>
        </div>
        <p className="chat-disclaimer">
          AI อาจเกิดข้อผิดพลาดได้ • ข้อมูลที่แสดงดึงมาจากฐานข้อมูลโดยตรง • อนุญาตเฉพาะคำสั่ง SELECT เท่านั้น
        </p>
      </div>
    </div>
  );
}
