// ============================================================
// components/ProgressBar.jsx
// แถบความคืบหน้า ใช้ทั้งหน้า Budgets (ใช้ไปกี่% ของวงเงิน)
// และหน้า Goals (เก็บเงินได้กี่% ของเป้าหมาย)
// ============================================================
export default function ProgressBar({ percent, danger = false }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="progress-track">
      <div
        className={'progress-fill' + (danger ? ' progress-fill--danger' : '')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
