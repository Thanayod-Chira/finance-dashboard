// ============================================================
// components/StatCard.jsx
// การ์ดตัวเลขสรุปเล็กๆ ที่ใช้ซ้ำได้ทั่วทั้งแอป (เช่น "รายจ่ายเดือนนี้: 12,000")
// ============================================================
const formatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export default function StatCard({ label, value, tone = 'neutral', suffix = '฿' }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value stat-value--${tone}`}>
        {suffix}{formatter.format(value)}
      </div>
    </div>
  );
}
