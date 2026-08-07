// ============================================================
// routes/investments.js -> /api/investments
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM investments ORDER BY purchase_date DESC');
  res.json(result.rows.map(r => ({
    ...r,
    amount_invested: Number(r.amount_invested),
  })));
});

router.post('/', async (req, res) => {
  const { name, assetType, amountInvested, purchaseDate, notes } = req.body;
  const result = await pool.query(
    `INSERT INTO investments (name, asset_type, amount_invested, purchase_date, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, assetType, amountInvested, purchaseDate, notes || null]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM investments WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
