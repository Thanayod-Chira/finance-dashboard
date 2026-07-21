// ============================================================
// routes/bills.js -> /api/bills   (recurring bills เช่น ค่าไฟ ค่าเช่า)
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM recurring_bills WHERE user_id = $1 ORDER BY due_day',
    [req.userId]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, amount, dueDay, category, isAutopay } = req.body;
  const result = await pool.query(
    `INSERT INTO recurring_bills (user_id, name, amount, due_day, category, is_autopay)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.userId, name, amount, dueDay, category || null, isAutopay || false]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, amount, dueDay, category, isAutopay } = req.body;
  const result = await pool.query(
    `UPDATE recurring_bills SET name=$1, amount=$2, due_day=$3, category=$4, is_autopay=$5
     WHERE id=$6 AND user_id=$7 RETURNING *`,
    [name, amount, dueDay, category, isAutopay, req.params.id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM recurring_bills WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;
