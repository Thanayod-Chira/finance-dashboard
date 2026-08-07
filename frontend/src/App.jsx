// ============================================================
// App.jsx - ศูนย์กลางเส้นทาง (routes) ของทั้งแอป
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Spending from './pages/Spending.jsx';
import Budgets from './pages/Budgets.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import Bills from './pages/Bills.jsx';
import Investments from './pages/Investments.jsx';
import Goals from './pages/Goals.jsx';
import AiChat from './pages/AiChat.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/spending" element={<Spending />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/ai-chat" element={<AiChat />} />

        {/* เส้นทางที่ไม่รู้จัก -> กลับหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
