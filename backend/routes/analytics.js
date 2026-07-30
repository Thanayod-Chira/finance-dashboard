// ============================================================
// routes/analytics.js -> /api/analytics/*
// ============================================================
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const [income, expense, investments, goals, subs, bills] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM transactions
       WHERE type='income' AND date_trunc('month',txn_date)=$1::date`,
      [`${month}-01`]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM transactions
       WHERE type='expense' AND date_trunc('month',txn_date)=$1::date`,
      [`${month}-01`]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount_invested),0) AS invested FROM investments`
    ),
    pool.query(
      `SELECT COALESCE(SUM(current_amount),0) AS saved, COALESCE(SUM(target_amount),0) AS target
       FROM financial_goals`
    ),
    pool.query(
      `SELECT COALESCE(SUM(CASE WHEN billing_cycle='monthly' THEN amount ELSE amount/12 END),0) AS monthly_total
       FROM subscriptions WHERE is_active=true`
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS monthly_total FROM recurring_bills`
    ),
  ]);

  res.json({
    monthlyIncome: Number(income.rows[0].total),
    monthlyExpense: Number(expense.rows[0].total),
    netCashflow: Number(income.rows[0].total) - Number(expense.rows[0].total),
    investedTotal: Number(investments.rows[0].invested),
    goalsSaved: Number(goals.rows[0].saved),
    goalsTarget: Number(goals.rows[0].target),
    subscriptionsMonthly: Number(subs.rows[0].monthly_total),
    billsMonthly: Number(bills.rows[0].monthly_total),
  });
});

// GET /api/analytics/spending-by-category?month=2026-07
router.get('/spending-by-category', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const result = await pool.query(
    `SELECT c.name AS category, c.color, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.type='expense' AND date_trunc('month',t.txn_date)=$1::date
     GROUP BY c.name, c.color
     ORDER BY total DESC`,
    [`${month}-01`]
  );
  res.json(result.rows.map(r => ({ ...r, total: Number(r.total) })));
});

// GET /api/analytics/monthly-trend?months=6
router.get('/monthly-trend', async (req, res) => {
  const months = Number(req.query.months) || 6;
  const result = await pool.query(
    `SELECT
       to_char(date_trunc('month', txn_date), 'YYYY-MM') AS month,
       SUM(amount) FILTER (WHERE type='income') AS income,
       SUM(amount) FILTER (WHERE type='expense') AS expense
     FROM transactions
     WHERE txn_date >= date_trunc('month', now()) - ($1 || ' months')::interval
     GROUP BY 1 ORDER BY 1`,
    [months]
  );
  res.json(result.rows.map(r => ({
    month: r.month,
    income: Number(r.income || 0),
    expense: Number(r.expense || 0),
  })));
});

// GET /api/analytics/upcoming - บิล+ซับสคริปชันที่ใกล้ครบกำหนดใน 14 วัน
router.get('/upcoming', async (req, res) => {
  const [subs, bills] = await Promise.all([
    pool.query(
      `SELECT id, name, amount, next_billing_date AS due_date, 'subscription' AS kind
       FROM subscriptions
       WHERE is_active=true
         AND next_billing_date BETWEEN now()::date AND now()::date + 14
       ORDER BY next_billing_date`
    ),
    pool.query(
      `SELECT id, name, amount, due_day, 'bill' AS kind FROM recurring_bills`
    ),
  ]);
  res.json({ subscriptions: subs.rows, bills: bills.rows });
});

module.exports = router;
