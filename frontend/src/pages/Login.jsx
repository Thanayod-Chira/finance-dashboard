// ============================================================
// pages/Login.jsx
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/client.js';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  // useState คือวิธีที่ React "จำ" ค่าที่เปลี่ยนแปลงได้ในหน้าจอ (เช่น ข้อความในกล่องกรอก)
  // ทุกครั้งที่ setEmail ถูกเรียก React จะวาดหน้าจอใหม่ให้ตรงกับค่าล่าสุด
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บ refresh แบบฟอร์ม HTML ปกติ
    setError('');
    setLoading(true);
    try {
      const { user, token } = await loginUser({ email, password });
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">฿ Ledger</div>
        <h1>เข้าสู่ระบบ</h1>
        <p className="auth-sub">จัดการเงินของคุณในที่เดียว</p>

        <label className="field">
          <span>อีเมล</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>

        <label className="field">
          <span>รหัสผ่าน</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        <p className="auth-switch">
          ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
        </p>
      </form>
    </div>
  );
}
