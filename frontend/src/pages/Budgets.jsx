// ============================================================
// pages/Budgets.jsx - ตั้งวงเงินงบประมาณต่อหมวดหมู่ และดูว่าใช้ไปเท่าไหร่แล้ว
// ============================================================
import { useEffect, useState } from 'react';
import { getBudgets, upsertBudget, deleteBudget, getCategories } from '../api/client.js';
import ProgressBar from '../components/ProgressBar.jsx';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ categoryId: '', monthlyLimit: '' });

  async function refresh() {
    const [b, c] = await Promise.all([getBudgets(month), getCategories()]);
    setBudgets(b);
    setCategories(c.filter((cat) => cat.type === 'expense'));
  }

  useEffect(() => { refresh(); }, [month]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.categoryId || !form.monthlyLimit) return;
    await upsertBudget({ categoryId: form.categoryId, monthYear: `${month}-01`, monthlyLimit: Number(form.monthlyLimit) });
    setForm({ categoryId: '', monthlyLimit: '' });
    refresh();
  }

  async function handleDelete(id) {
    await deleteBudget(id);
    refresh();
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>งบประมาณ</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="month-picker" />
      </header>

      <div className="two-col">
        <div className="panel">
          <h2>ตั้งวงเงินงบประมาณ</h2>
          <form onSubmit={handleSubmit} className="stack-form">
            <label className="field">
              <span>หมวดหมู่</span>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— เลือกหมวดหมู่ —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>วงเงินต่อเดือน</span>
              <input type="number" min="0" step="1" required value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })} placeholder="เช่น 5000" />
            </label>
            <button className="btn-primary" type="submit">บันทึกวงเงิน</button>
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
                return (
                  <li key={b.id} className="budget-row">
                    <div className="budget-row-top">
                      <span>{b.category_name}</span>
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
