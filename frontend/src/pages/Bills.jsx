// ============================================================
// pages/Bills.jsx - จัดการบิลประจำ เช่น ค่าไฟ ค่าน้ำ ค่าเช่า
// ============================================================
import { useEffect, useState } from 'react';
import { getBills, createBill, deleteBill } from '../api/client.js';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', dueDay: '', category: '', isAutopay: false });

  async function refresh() { setBills(await getBills()); }
  useEffect(() => { refresh(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await createBill({ ...form, amount: Number(form.amount), dueDay: Number(form.dueDay) });
    setForm({ name: '', amount: '', dueDay: '', category: '', isAutopay: false });
    refresh();
  }

  async function handleDelete(id) { await deleteBill(id); refresh(); }

  const monthlyTotal = bills.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="page">
      <header className="page-header"><h1>บิลประจำ</h1></header>

      <section className="stat-grid">
        <div className="stat-card"><div className="stat-label">รวมต่อเดือน</div><div className="stat-value stat-value--negative">฿{fmt.format(monthlyTotal)}</div></div>
        <div className="stat-card"><div className="stat-label">จำนวนบิล</div><div className="stat-value">{bills.length}</div></div>
      </section>

      <div className="two-col">
        <div className="panel">
          <h2>เพิ่มบิลประจำ</h2>
          <form onSubmit={handleSubmit} className="stack-form">
            <label className="field"><span>ชื่อบิล</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ค่าไฟฟ้า" /></label>
            <label className="field"><span>จำนวนเงิน (โดยประมาณ)</span>
              <input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label className="field"><span>วันครบกำหนดของทุกเดือน (1-31)</span>
              <input type="number" min="1" max="31" required value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} /></label>
            <label className="field"><span>หมวดหมู่ (ไม่บังคับ)</span>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="เช่น สาธารณูปโภค" /></label>
            <label className="checkbox-field">
              <input type="checkbox" checked={form.isAutopay} onChange={(e) => setForm({ ...form, isAutopay: e.target.checked })} />
              <span>หักบัญชีอัตโนมัติ</span>
            </label>
            <button className="btn-primary" type="submit">เพิ่มบิล</button>
          </form>
        </div>

        <div className="panel">
          <h2>รายการบิลทั้งหมด</h2>
          {bills.length === 0 ? <p className="empty-hint">ยังไม่มีบิลประจำ</p> : (
            <ul className="txn-list">
              {bills.map((b) => (
                <li key={b.id} className="txn-row">
                  <div className="txn-info">
                    <div className="txn-desc">{b.name} {b.is_autopay && <span className="pill">หักอัตโนมัติ</span>}</div>
                    <div className="txn-meta">ครบกำหนดทุกวันที่ {b.due_day} ของเดือน</div>
                  </div>
                  <div className="mono stat-value--negative">฿{fmt.format(b.amount)}</div>
                  <button className="btn-icon" onClick={() => handleDelete(b.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
