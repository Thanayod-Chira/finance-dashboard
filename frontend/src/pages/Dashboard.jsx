// ============================================================
// pages/Dashboard.jsx - หน้าแรกสุด รวมภาพรวมการเงินทั้งหมด
// ============================================================
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { getSummary, getSpendingByCategory, getMonthlyTrend, getUpcoming } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
const currentMonth = new Date().toISOString().slice(0, 7);

export default function Dashboard() {
  // เก็บข้อมูลที่ได้จาก API ไว้ใน state แยกกันตามชนิด
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect ที่มี [] ว่างท้ายสุด = "รันครั้งเดียวตอนหน้าจอนี้เพิ่งโหลดเสร็จ"
  useEffect(() => {
    async function loadAll() {
      try {
        const [s, c, t, u] = await Promise.all([
          getSummary(currentMonth),
          getSpendingByCategory(currentMonth),
          getMonthlyTrend(6),
          getUpcoming(),
        ]);
        setSummary(s);
        setByCategory(c);
        setTrend(t);
        setUpcoming(u);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) return <div className="page-loading">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="page-loading" style={{ color: '#ef4444' }}>{error}</div>;
  if (!summary) return null;

  return (
    <div className="page">
      <header className="page-header">
        <h1>ภาพรวมการเงิน</h1>
        <p className="page-sub">เดือน {formatThaiMonth(currentMonth)}</p>
      </header>

      {/* --- แถวการ์ดสรุปตัวเลขหลัก --- */}
      <section className="stat-grid">
        <StatCard label="รายรับเดือนนี้" value={summary.monthlyIncome} tone="positive" />
        <StatCard label="รายจ่ายเดือนนี้" value={summary.monthlyExpense} tone="negative" />
        <StatCard label="กระแสเงินสดสุทธิ" value={summary.netCashflow} tone={summary.netCashflow >= 0 ? 'positive' : 'negative'} />
        <StatCard label="เงินลงทุนรวม" value={summary.investedTotal} tone="neutral" />
      </section>

      <section className="stat-grid">
        <StatCard label="เป้าหมายการออมรวม" value={summary.goalsTarget} tone="neutral" />
        <StatCard label="เงินเก็บเพื่อเป้าหมาย" value={summary.goalsSaved} tone="neutral" />
        <StatCard label="ค่าสมาชิกรายเดือน" value={summary.subscriptionsMonthly} tone="negative" />
        <StatCard label="บิลประจำรายเดือน" value={summary.billsMonthly} tone="negative" />
      </section>

      <div className="chart-grid">
        {/* --- กราฟวงกลม: สัดส่วนรายจ่ายตามหมวดหมู่ --- */}
        <div className="panel">
          <h2>รายจ่ายตามหมวดหมู่</h2>
          {byCategory.length === 0 ? (
            <p className="empty-hint">ยังไม่มีรายจ่ายในเดือนนี้</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color || '#4C6E5D'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `฿${fmt.format(v)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* --- กราฟเส้น: แนวโน้มรายรับ-รายจ่ายย้อนหลัง 6 เดือน --- */}
        <div className="panel">
          <h2>แนวโน้ม 6 เดือนล่าสุด</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d4" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `฿${fmt.format(v)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" name="รายรับ" stroke="#2F6F4F" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke="#B5533C" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- รายการที่ใกล้ครบกำหนดจ่าย --- */}
      <div className="panel">
        <h2>ใกล้ถึงกำหนดจ่าย (14 วันข้างหน้า)</h2>
        {!upcoming || upcoming.subscriptions.length === 0 ? (
          <p className="empty-hint">ไม่มีรายการที่ใกล้ครบกำหนด</p>
        ) : (
          <ul className="upcoming-list">
            {upcoming.subscriptions.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span className="mono">฿{fmt.format(item.amount)}</span>
                <span className="due-date">{item.due_date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatThaiMonth(ym) {
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const [y, m] = ym.split('-');
  return `${months[Number(m) - 1]} ${Number(y) + 543}`;
}
