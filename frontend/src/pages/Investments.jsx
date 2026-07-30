// ============================================================
// pages/Investments.jsx - ติดตามเงินลงทุน
// ============================================================
import { useEffect, useState } from 'react';
import { getInvestments, createInvestment, deleteInvestment } from '../api/client.js';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
const ASSET_TYPES = ['stock', 'fund', 'crypto', 'gold', 'bond', 'other'];
const ASSET_LABELS = { stock: 'หุ้น', fund: 'กองทุน', crypto: 'คริปโต', gold: 'ทองคำ', bond: 'พันธบัตร', other: 'อื่นๆ' };

export default function Investments() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', assetType: 'stock', amountInvested: '', purchaseDate: '', notes: '' });

  async function refresh() { setItems(await getInvestments()); }
  useEffect(() => { refresh(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await createInvestment({ ...form, amountInvested: Number(form.amountInvested) });
    setForm({ name: '', assetType: 'stock', amountInvested: '', purchaseDate: '', notes: '' });
    refresh();
  }

  async function handleDelete(id) { await deleteInvestment(id); refresh(); }

  const totalInvested = items.reduce((s, i) => s + Number(i.amount_invested), 0);

  return (
    <div className="page">
      <header className="page-header"><h1>การลงทุน</h1></header>

      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">เงินลงทุนทั้งหมด</div>
          <div className="stat-value">฿{fmt.format(totalInvested)}</div>
        </div>
      </section>

      <div className="two-col">
        <div className="panel">
          <h2>เพิ่มรายการลงทุน</h2>
          <form onSubmit={handleSubmit} className="stack-form">
            <label className="field"><span>ชื่อสินทรัพย์</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น SET50 Index Fund" /></label>
            <label className="field"><span>ประเภท</span>
              <select value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{ASSET_LABELS[t]}</option>)}
              </select></label>
            <label className="field"><span>จำนวนเงินที่ลงทุน</span>
              <input type="number" step="0.01" min="0" required value={form.amountInvested} onChange={(e) => setForm({ ...form, amountInvested: e.target.value })} /></label>
            <label className="field"><span>วันที่ซื้อ</span>
              <input type="date" required value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></label>
            <button className="btn-primary" type="submit">เพิ่มรายการ</button>
          </form>
        </div>

        <div className="panel">
          <h2>พอร์ตการลงทุน</h2>
          {items.length === 0 ? <p className="empty-hint">ยังไม่มีรายการลงทุน</p> : (
            <ul className="txn-list">
              {items.map((i) => (
                <li key={i.id} className="investment-row">
                  <div className="txn-info">
                    <div className="txn-desc">{i.name} <span className="pill">{ASSET_LABELS[i.asset_type] || i.asset_type}</span></div>
                    <div className="txn-meta">วันที่ซื้อ: {i.purchase_date}</div>
                  </div>
                  <div className="mono">฿{fmt.format(i.amount_invested)}</div>
                  <button className="btn-icon" onClick={() => handleDelete(i.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
