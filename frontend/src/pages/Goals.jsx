// ============================================================
// pages/Goals.jsx - เป้าหมายทางการเงิน เช่น กองทุนฉุกเฉิน, ดาวน์บ้าน
// ============================================================
import { useEffect, useState } from 'react';
import { getGoals, createGoal, contributeToGoal, deleteGoal } from '../api/client.js';
import ProgressBar from '../components/ProgressBar.jsx';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
  const [contribution, setContribution] = useState({});

  async function refresh() { setGoals(await getGoals()); }
  useEffect(() => { refresh(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await createGoal({ ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount || 0) });
    setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
    refresh();
  }

  async function handleContribute(id) {
    const amount = Number(contribution[id]);
    if (!amount) return;
    await contributeToGoal(id, amount);
    setContribution({ ...contribution, [id]: '' });
    refresh();
  }

  async function handleDelete(id) { await deleteGoal(id); refresh(); }

  return (
    <div className="page">
      <header className="page-header"><h1>เป้าหมายทางการเงิน</h1></header>

      <div className="two-col">
        <div className="panel">
          <h2>สร้างเป้าหมายใหม่</h2>
          <form onSubmit={handleSubmit} className="stack-form">
            <label className="field"><span>ชื่อเป้าหมาย</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น กองทุนฉุกเฉิน" /></label>
            <label className="field"><span>จำนวนเงินเป้าหมาย</span>
              <input type="number" step="0.01" min="0" required value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></label>
            <label className="field"><span>เงินที่มีอยู่แล้ว (ไม่บังคับ)</span>
              <input type="number" step="0.01" min="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} /></label>
            <label className="field"><span>วันที่ต้องการให้สำเร็จ (ไม่บังคับ)</span>
              <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
            <button className="btn-primary" type="submit">สร้างเป้าหมาย</button>
          </form>
        </div>

        <div className="panel">
          <h2>เป้าหมายทั้งหมด</h2>
          {goals.length === 0 ? <p className="empty-hint">ยังไม่มีเป้าหมาย</p> : (
            <ul className="goal-list">
              {goals.map((g) => {
                const percent = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                return (
                  <li key={g.id} className="goal-card">
                    <div className="budget-row-top">
                      <span>{g.name}</span>
                      <button className="btn-icon" onClick={() => handleDelete(g.id)}>✕</button>
                    </div>
                    <ProgressBar percent={percent} />
                    <div className="budget-row-bottom">
                      <span className="mono">฿{fmt.format(g.current_amount)} / ฿{fmt.format(g.target_amount)}</span>
                      <span className="muted">{percent.toFixed(0)}%</span>
                    </div>
                    {g.target_date && <div className="txn-meta">เป้าหมายวันที่ {g.target_date}</div>}
                    <div className="inline-form" style={{ marginTop: 8 }}>
                      <input type="number" placeholder="เติมเงิน" value={contribution[g.id] || ''}
                        onChange={(e) => setContribution({ ...contribution, [g.id]: e.target.value })} />
                      <button className="btn-secondary btn-sm" onClick={() => handleContribute(g.id)}>เติมเงิน</button>
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
