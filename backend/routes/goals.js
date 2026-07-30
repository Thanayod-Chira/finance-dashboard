// ============================================================
// routes/goals.js -> /api/goals
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM financial_goals ORDER BY target_date NULLS LAST'
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, targetAmount, currentAmount, targetDate, icon } = req.body;
  const result = await pool.query(
    `INSERT INTO financial_goals (name, target_amount, current_amount, target_date, icon)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, targetAmount, currentAmount || 0, targetDate || null, icon || 'target']
  );
  res.status(201).json(result.rows[0]);
});

// PATCH เติมเงินเข้าเป้าหมาย
router.patch('/:id/contribute', async (req, res) => {
  const { amount } = req.body;
  const result = await pool.query(
    `UPDATE financial_goals SET current_amount = current_amount + $1
     WHERE id = $2 RETURNING *`,
    [amount, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM financial_goals WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
