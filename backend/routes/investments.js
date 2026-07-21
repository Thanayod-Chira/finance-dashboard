// ============================================================
// routes/investments.js -> /api/investments
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM investments WHERE user_id = $1 ORDER BY purchase_date DESC',
    [req.userId]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, assetType, amountInvested, currentValue, purchaseDate, notes } = req.body;
  const result = await pool.query(
    `INSERT INTO investments (user_id, name, asset_type, amount_invested, current_value, purchase_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.userId, name, assetType, amountInvested, currentValue, purchaseDate, notes || null]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH ใช้อัปเดตแค่มูลค่าปัจจุบัน (ใช้บ่อยสุด เพราะราคาสินทรัพย์เปลี่ยนทุกวัน)
router.patch('/:id/value', async (req, res) => {
  const { currentValue } = req.body;
  const result = await pool.query(
    `UPDATE investments SET current_value = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [currentValue, req.params.id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM investments WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;
