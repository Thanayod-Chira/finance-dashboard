// ============================================================
// routes/transactions.js -> /api/transactions
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET รายการธุรกรรม (มี filter ตามเดือน / ประเภท / หมวดหมู่ ได้)
router.get('/', async (req, res) => {
  const { month, type, categoryId } = req.query;

  const conditions = ['1=1'];
  const values = [];

  if (month) {
    values.push(`${month}-01`);
    conditions.push(`date_trunc('month', t.txn_date) = $${values.length}::date`);
  }
  if (type) {
    values.push(type);
    conditions.push(`t.type = $${values.length}`);
  }
  if (categoryId) {
    values.push(categoryId);
    conditions.push(`t.category_id = $${values.length}`);
  }

  const sql = `
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.txn_date DESC, t.created_at DESC
  `;
  const result = await pool.query(sql, values);
  res.json(result.rows);
});

// POST สร้างธุรกรรมใหม่
router.post('/', async (req, res) => {
  const { categoryId, type, amount, description, txnDate } = req.body;
  if (!type || !amount || !txnDate) {
    return res.status(400).json({ error: 'ต้องระบุ type, amount, txnDate' });
  }
  const result = await pool.query(
    `INSERT INTO transactions (category_id, type, amount, description, txn_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [categoryId || null, type, amount, description || null, txnDate]
  );
  res.status(201).json(result.rows[0]);
});

// PUT แก้ไขธุรกรรม
router.put('/:id', async (req, res) => {
  const { categoryId, type, amount, description, txnDate } = req.body;
  const result = await pool.query(
    `UPDATE transactions
     SET category_id = $1, type = $2, amount = $3, description = $4, txn_date = $5
     WHERE id = $6 RETURNING *`,
    [categoryId || null, type, amount, description, txnDate, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(result.rows[0]);
});

// DELETE ลบธุรกรรม
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
