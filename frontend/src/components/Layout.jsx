// ============================================================
// components/Layout.jsx
// ============================================================
// โครงหน้าที่ใช้ร่วมกันทุกหน้า (หลัง login): แถบเมนูซ้ายมือ + เนื้อหาหลัก
// ============================================================
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'ภาพรวม', icon: '◈', end: true },
  { to: '/spending', label: 'รายรับ-รายจ่าย', icon: '≡' },
  { to: '/budgets', label: 'งบประมาณ', icon: '▤' },
  { to: '/subscriptions', label: 'สมาชิกรายเดือน', icon: '↻' },
  { to: '/bills', label: 'บิลประจำ', icon: '▧' },
  { to: '/investments', label: 'การลงทุน', icon: '↗' },
  { to: '/goals', label: 'เป้าหมาย', icon: '◎' },
];

export default function Layout({ children }) {

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">฿</span>
          <span className="brand-name">Ledger</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-item' + (isActive ? ' nav-item--active' : '')}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
