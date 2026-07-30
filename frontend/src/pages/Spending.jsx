// ============================================================
// pages/Spending.jsx - บันทึกและดูรายการรายรับ-รายจ่าย
// ============================================================
import { useEffect, useState } from 'react';
import {
  getTransactions, createTransaction, deleteTransaction,
  getCategories, createCategory, deleteCategory,
} from '../api/client.js';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Spending() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // ค่าของฟอร์มเพิ่มรายการใหม่
  const [form, setForm] = useState({ type: 'expense', amount: '', description: '', categoryId: '', txnDate: todayISO() });
  const [newCategoryName, setNewCategoryName] = useState('');

  async function refresh() {
    const [t, c] = await Promise.all([getTransactions({ month }), getCategories()]);
    setTransactions(t);
    setCategories(c);
  }

  useEffect(() => { refresh(); }, [month]);

  async function handleAddTransaction(e) {
    e.preventDefault();
    if (!form.amount) return;
    await createTransaction({ ...form, amount: Number(form.amount), categoryId: form.categoryId || null });
    setForm({ ...form, amount: '', description: '' });
    refresh();
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await createCategory({ name: newCategoryName.trim(), type: form.type });
    setNewCategoryName('');
    refresh();
  }

  async function handleDelete(id) {
    await deleteTransaction(id);
    refresh();
  }

  async function handleDeleteCategory(id) {
    if (!confirm('ลบหมวดหมู่นี้? งบประมาณที่ผูกอยู่จะถูกลบด้วย')) return;
    await deleteCategory(id);
    refresh();
  }

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="page">
      <header className="page-header">
        <h1>รายรับ-รายจ่าย</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="month-picker" />
      </header>

      <section className="stat-grid">
        <div className="stat-card"><div className="stat-label">รายรับรวม</div><div className="stat-value stat-value--positive">฿{fmt.format(totalIncome)}</div></div>
        <div className="stat-card"><div className="stat-label">รายจ่ายรวม</div><div className="stat-value stat-value--negative">฿{fmt.format(totalExpense)}</div></div>
      </section>

      <div className="two-col">
        {/* --- ฟอร์มเพิ่มรายการ --- */}
        <div className="panel">
          <h2>เพิ่มรายการใหม่</h2>
          <form onSubmit={handleAddTransaction} className="stack-form">
            <div className="segmented">
              <button type="button" className={form.type === 'expense' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'expense', categoryId: '' })}>รายจ่าย</button>
              <button type="button" className={form.type === 'income' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'income', categoryId: '' })}>รายรับ</button>
            </div>

            <label className="field">
              <span>จำนวนเงิน</span>
              <input type="number" step="0.01" min="0" required value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </label>

            <label className="field">
              <span>หมวดหมู่</span>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— ไม่ระบุ —</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>รายละเอียด</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="เช่น ข้าวเที่ยง" />
            </label>

            <label className="field">
              <span>วันที่</span>
              <input type="date" required value={form.txnDate} onChange={(e) => setForm({ ...form, txnDate: e.target.value })} />
            </label>

            <button className="btn-primary" type="submit">บันทึกรายการ</button>
          </form>

          <div className="divider" />

          <form onSubmit={handleAddCategory} className="inline-form">
            <input placeholder={`เพิ่มหมวดหมู่${form.type === 'expense' ? 'รายจ่าย' : 'รายรับ'}ใหม่`}
              value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            <button className="btn-secondary" type="submit">เพิ่ม</button>
          </form>

          {/* ลิสต์หมวดหมู่ปัจจุบัน */}
          {filteredCategories.length > 0 && (
            <ul className="category-list">
              {filteredCategories.map((c) => (
                <li key={c.id} className="category-row">
                  <span className="category-dot" style={{ background: c.color }} />
                  <span className="category-name">{c.name}</span>
                  <button className="btn-icon" onClick={() => handleDeleteCategory(c.id)} title="ลบหมวดหมู่">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* --- รายการทั้งหมด --- */}
        <div className="panel">
          <h2>รายการทั้งหมดในเดือนนี้</h2>
          {transactions.length === 0 ? (
            <p className="empty-hint">ยังไม่มีรายการในเดือนนี้</p>
          ) : (
            <ul className="txn-list">
              {transactions.map((t) => (
                <li key={t.id} className="txn-row">
                  <span className="txn-dot" style={{ background: t.category_color || '#999' }} />
                  <div className="txn-info">
                    <div className="txn-desc">{t.description || t.category_name || '(ไม่มีรายละเอียด)'}</div>
                    <div className="txn-meta">{t.category_name || 'ไม่มีหมวดหมู่'} · {t.txn_date}</div>
                  </div>
                  <div className={`mono txn-amount ${t.type === 'income' ? 'stat-value--positive' : 'stat-value--negative'}`}>
                    {t.type === 'income' ? '+' : '−'}฿{fmt.format(t.amount)}
                  </div>
                  <button className="btn-icon" onClick={() => handleDelete(t.id)} title="ลบ">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
