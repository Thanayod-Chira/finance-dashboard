// ============================================================
// App.jsx - ศูนย์กลางเส้นทาง (routes) ของทั้งแอป
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Spending from './pages/Spending.jsx';
import Budgets from './pages/Budgets.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import Bills from './pages/Bills.jsx';
import Investments from './pages/Investments.jsx';
import Goals from './pages/Goals.jsx';

// ------------------------------------------------------------
// ProtectedRoute: component ห่อหุ้ม (wrapper) ที่เช็คก่อนว่า login รึยัง
// ถ้ายัง -> เด้งไปหน้า /login
// ถ้า login แล้ว -> แสดงเนื้อหาจริงข้างใน (children)
// ------------------------------------------------------------
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/spending" element={<ProtectedRoute><Spending /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
        <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
        <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />

        {/* เส้นทางที่ไม่รู้จัก -> กลับหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
