// ============================================================
// routes/categories.js -> /api/categories
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY type, name');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !['expense', 'income'].includes(type)) {
    return res.status(400).json({ error: 'ต้องระบุ name และ type (expense/income)' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO categories (name, type, color) VALUES ($1,$2,$3) RETURNING *`,
      [name, type, color || '#4C6E5D']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'มีหมวดหมู่นี้อยู่แล้ว' });
    res.status(500).json({ error: 'สร้างหมวดหมู่ไม่สำเร็จ' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
