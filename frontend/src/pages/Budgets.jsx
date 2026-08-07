// ============================================================
// pages/Budgets.jsx - ตั้งวงเงินงบประมาณต่อหมวดหมู่ และดูว่าใช้ไปเท่าไหร่แล้ว
// ============================================================
import { useEffect, useState } from 'react';
import { getBudgets, upsertBudget, deleteBudget, getCategories, getSummary } from '../api/client.js';
import ProgressBar from '../components/ProgressBar.jsx';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [form, setForm] = useState({ categoryId: '', value: '', mode: 'amount' });

  async function refresh() {
    const [b, c, summary] = await Promise.all([
      getBudgets(month),
      getCategories(),
      getSummary(month),
    ]);
    setBudgets(b);
    setCategories(c.filter((cat) => cat.type === 'expense'));
    setMonthlyIncome(summary.monthlyIncome || 0);
  }

  useEffect(() => { refresh(); }, [month]);

  // แปลง value ในฟอร์มเป็นจำนวนเงินจริง (บาท)
  function resolveAmount() {
    const v = Number(form.value);
    if (!v || v <= 0) return 0;
    if (form.mode === 'percent') return Math.round((v / 100) * monthlyIncome);
    return v;
  }

  const previewAmount = resolveAmount();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.categoryId || !form.value) return;
    const monthlyLimit = resolveAmount();
    if (monthlyLimit <= 0) return;
    await upsertBudget({
      categoryId: form.categoryId,
      monthYear: `${month}-01`,
      monthlyLimit,
    });
    setForm({ categoryId: '', value: '', mode: form.mode });
    refresh();
  }

  async function handleDelete(id) {
    await deleteBudget(id);
    refresh();
  }

  // คำนวณงบรวมทั้งหมดที่ตั้งไว้
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const budgetPercent = monthlyIncome > 0 ? (totalBudgeted / monthlyIncome) * 100 : 0;
  const isOverIncome = totalBudgeted > monthlyIncome && monthlyIncome > 0;

  return (
    <div className="page">
      <header className="page-header">
        <h1>งบประมาณ</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="month-picker" />
      </header>

      {/* แถบสรุปงบรวม vs เงินเดือน */}
      {monthlyIncome > 0 && (
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>งบรวมทั้งหมด</span>
            <span className="mono" style={{ color: isOverIncome ? 'var(--danger, #ef4444)' : 'inherit' }}>
              ฿{fmt.format(totalBudgeted)} / ฿{fmt.format(monthlyIncome)}
              <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                ({budgetPercent.toFixed(1)}% ของเงินเดือน)
              </span>
            </span>
          </div>
          <ProgressBar percent={Math.min(budgetPercent, 100)} danger={isOverIncome} />
          {isOverIncome ? (
            <p style={{ marginTop: '0.5rem', color: 'var(--danger, #ef4444)', fontSize: '0.875rem' }}>
              ⚠️ งบรวมเกินเงินเดือน ฿{fmt.format(totalBudgeted - monthlyIncome)} — แนะนำให้ปรับลดบางหมวดหมู่
            </p>
          ) : totalBudgeted > 0 ? (
            <p style={{ marginTop: '0.5rem', color: 'var(--muted, #6b7280)', fontSize: '0.875rem' }}>
              ✅ งบที่ยังไม่ได้ตั้ง ฿{fmt.format(monthlyIncome - totalBudgeted)}
            </p>
          ) : null}
        </div>
      )}

      <div className="two-col">
        <div className="panel">
          <h2>ตั้งวงเงินงบประมาณ</h2>
          <form onSubmit={handleSubmit} className="stack-form">

            {/* Toggle โหมด */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                id="mode-amount"
                onClick={() => setForm({ ...form, mode: 'amount', value: '' })}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #e5e7eb)',
                  background: form.mode === 'amount' ? 'var(--primary, #6366f1)' : 'transparent',
                  color: form.mode === 'amount' ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                ฿ จำนวนเงิน
              </button>
              <button
                type="button"
                id="mode-percent"
                onClick={() => { if (monthlyIncome > 0) setForm({ ...form, mode: 'percent', value: '' }); }}
                disabled={monthlyIncome === 0}
                title={monthlyIncome === 0 ? 'ยังไม่มีรายรับเดือนนี้' : '% ของเงินเดือน'}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border, #e5e7eb)',
                  background: form.mode === 'percent' ? 'var(--primary, #6366f1)' : 'transparent',
                  color: form.mode === 'percent' ? '#fff' : monthlyIncome === 0 ? 'var(--muted, #6b7280)' : 'inherit',
                  cursor: monthlyIncome === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                  opacity: monthlyIncome === 0 ? 0.5 : 1,
                }}
              >
                % ของเงินเดือน
              </button>
            </div>

            {monthlyIncome === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted, #6b7280)', marginTop: 0 }}>
                * บันทึกรายรับเดือนนี้ก่อน ถึงจะตั้งแบบ % ได้
              </p>
            )}

            <label className="field">
              <span>หมวดหมู่</span>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— เลือกหมวดหมู่ —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>
                {form.mode === 'percent'
                  ? `% ของเงินเดือน (฿${fmt.format(monthlyIncome)})`
                  : 'วงเงินต่อเดือน (บาท)'}
              </span>
              <input
                id="budget-value-input"
                type="number"
                min="0"
                step={form.mode === 'percent' ? '0.1' : '1'}
                max={form.mode === 'percent' ? '100' : undefined}
                required
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.mode === 'percent' ? 'เช่น 30 (= 30%)' : 'เช่น 5000'}
              />
            </label>

            {/* Preview เมื่อใส่ % */}
            {form.mode === 'percent' && form.value && previewAmount > 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted, #6b7280)', marginTop: '-0.25rem' }}>
                = ฿{fmt.format(previewAmount)} ต่อเดือน
              </p>
            )}

            {/* เตือนเมื่อกำลังจะเกินเงินเดือน */}
            {previewAmount > 0 && monthlyIncome > 0 && (totalBudgeted + previewAmount > monthlyIncome) && (
              <p style={{ fontSize: '0.875rem', color: 'var(--danger, #ef4444)', marginTop: '-0.25rem' }}>
                ⚠️ งบรวมจะเกินเงินเดือน (฿{fmt.format(totalBudgeted + previewAmount - monthlyIncome)} เกิน)
              </p>
            )}

            <button className="btn-primary" type="submit" id="save-budget-btn">บันทึกวงเงิน</button>
          </form>
        </div>

        <div className="panel">
          <h2>ความคืบหน้าเดือนนี้</h2>
          {budgets.length === 0 ? (
            <p className="empty-hint">ยังไม่ได้ตั้งงบประมาณสำหรับเดือนนี้</p>
          ) : (
            <ul className="budget-list">
              {budgets.map((b) => {
                const percent = b.monthly_limit > 0 ? (b.spent / b.monthly_limit) * 100 : 0;
                const over = b.spent > b.monthly_limit;
                const incomePercent = monthlyIncome > 0 ? ((b.monthly_limit / monthlyIncome) * 100).toFixed(1) : null;
                return (
                  <li key={b.id} className="budget-row">
                    <div className="budget-row-top">
                      <span>
                        {b.category_name}
                        {incomePercent && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.4rem' }}>
                            ({incomePercent}%)
                          </span>
                        )}
                      </span>
                      <span className="mono">฿{fmt.format(b.spent)} / ฿{fmt.format(b.monthly_limit)}</span>
                    </div>
                    <ProgressBar percent={percent} danger={over} />
                    <div className="budget-row-bottom">
                      <span className={over ? 'stat-value--negative' : 'muted'}>
                        {over ? `เกินงบ ฿${fmt.format(b.spent - b.monthly_limit)}` : `เหลือ ฿${fmt.format(b.monthly_limit - b.spent)}`}
                      </span>
                      <button className="btn-icon" onClick={() => handleDelete(b.id)}>✕</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

