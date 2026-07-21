// ============================================================
// pages/Subscriptions.jsx - จัดการค่าสมาชิกรายเดือน/รายปี
// ============================================================
import { useEffect, useState } from 'react';
import { getSubscriptions, createSubscription, deleteSubscription } from '../api/client.js';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', billingCycle: 'monthly', nextBillingDate: '', category: '' });

  async function refresh() { setSubs(await getSubscriptions()); }
  useEffect(() => { refresh(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await createSubscription({ ...form, amount: Number(form.amount) });
    setForm({ name: '', amount: '', billingCycle: 'monthly', nextBillingDate: '', category: '' });
    refresh();
  }

  async function handleDelete(id) { await deleteSubscription(id); refresh(); }

  const monthlyTotal = subs.reduce((s, x) => s + (x.billing_cycle === 'monthly' ? Number(x.amount) : Number(x.amount) / 12), 0);

  return (
    <div className="page">
      <header className="page-header"><h1>สมาชิกรายเดือน</h1></header>

      <section className="stat-grid">
        <div className="stat-card"><div className="stat-label">รวมต่อเดือน (เทียบเท่า)</div><div className="stat-value stat-value--negative">฿{fmt.format(monthlyTotal)}</div></div>
        <div className="stat-card"><div className="stat-label">จำนวนรายการ</div><div className="stat-value">{subs.length}</div></div>
      </section>

      <div className="two-col">
        <div className="panel">
          <h2>เพิ่มบริการสมาชิก</h2>
          <form onSubmit={handleSubmit} className="stack-form">
            <label className="field"><span>ชื่อบริการ</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Netflix" /></label>
            <label className="field"><span>ราคา</span>
              <input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label className="field"><span>รอบบิล</span>
              <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select></label>
            <label className="field"><span>วันที่เรียกเก็บครั้งถัดไป</span>
              <input type="date" required value={form.nextBillingDate} onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })} /></label>
            <label className="field"><span>หมวดหมู่ (ไม่บังคับ)</span>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="เช่น บันเทิง" /></label>
            <button className="btn-primary" type="submit">เพิ่มรายการ</button>
          </form>
        </div>

        <div className="panel">
          <h2>รายการทั้งหมด</h2>
          {subs.length === 0 ? <p className="empty-hint">ยังไม่มีบริการสมาชิก</p> : (
            <ul className="txn-list">
              {subs.map((s) => (
                <li key={s.id} className="txn-row">
                  <div className="txn-info">
                    <div className="txn-desc">{s.name}</div>
                    <div className="txn-meta">{s.billing_cycle === 'monthly' ? 'รายเดือน' : 'รายปี'} · เรียกเก็บ {s.next_billing_date}</div>
                  </div>
                  <div className="mono stat-value--negative">฿{fmt.format(s.amount)}</div>
                  <button className="btn-icon" onClick={() => handleDelete(s.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
