// ============================================================
// routes/subscriptions.js -> /api/subscriptions
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY next_billing_date',
    [req.userId]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, amount, billingCycle, nextBillingDate, category } = req.body;
  const result = await pool.query(
    `INSERT INTO subscriptions (user_id, name, amount, billing_cycle, next_billing_date, category)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.userId, name, amount, billingCycle, nextBillingDate, category || null]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, amount, billingCycle, nextBillingDate, category, isActive } = req.body;
  const result = await pool.query(
    `UPDATE subscriptions SET name=$1, amount=$2, billing_cycle=$3, next_billing_date=$4,
       category=$5, is_active=$6
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [name, amount, billingCycle, nextBillingDate, category, isActive, req.params.id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM subscriptions WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;
