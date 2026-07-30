// ============================================================
// routes/budgets.js -> /api/budgets
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET งบประมาณของเดือนที่ระบุ พร้อมยอดใช้จ่ายจริงเทียบด้วย
// ?month=2026-07
router.get('/', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const result = await pool.query(
    `SELECT
        b.id, b.monthly_limit, b.month_year,
        c.id AS category_id, c.name AS category_name, c.color AS category_color,
        COALESCE(SUM(t.amount) FILTER (
          WHERE t.type = 'expense' AND date_trunc('month', t.txn_date) = b.month_year
        ), 0) AS spent
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t ON t.category_id = c.id
     WHERE date_trunc('month', b.month_year) = $1::date
     GROUP BY b.id, c.id
     ORDER BY c.name`,
    [`${month}-01`]
  );
  res.json(result.rows);
});

// POST สร้าง/อัปเดตงบประมาณ (upsert)
router.post('/', async (req, res) => {
  const { categoryId, monthYear, monthlyLimit } = req.body;
  const result = await pool.query(
    `INSERT INTO budgets (category_id, month_year, monthly_limit)
     VALUES ($1,$2,$3)
     ON CONFLICT (category_id, month_year)
     DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
     RETURNING *`,
    [categoryId, monthYear, monthlyLimit]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM budgets WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
