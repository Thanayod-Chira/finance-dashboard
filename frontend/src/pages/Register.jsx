// ============================================================
// pages/Register.jsx
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/client.js';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, token } = await registerUser({ fullName, email, password });
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">฿ Ledger</div>
        <h1>สร้างบัญชีใหม่</h1>
        <p className="auth-sub">เริ่มติดตามการเงินของคุณวันนี้</p>

        <label className="field">
          <span>ชื่อ-นามสกุล</span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="สมชาย ใจดี" />
        </label>

        <label className="field">
          <span>อีเมล</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>

        <label className="field">
          <span>รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</span>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>

        <p className="auth-switch">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </form>
    </div>
  );
}
