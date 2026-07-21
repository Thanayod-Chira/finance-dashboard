// ============================================================
// AuthContext.jsx
// ============================================================
// "Context" คือวิธีของ React ในการแชร์ข้อมูล (เช่น "ใคร login อยู่")
// ไปให้ทุก component ในแอปใช้ได้ โดยไม่ต้องส่ง props ลงไปทีละชั้นๆ
// ============================================================
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // เริ่มต้นด้วยการอ่านค่าจาก localStorage (เผื่อผู้ใช้ปิด-เปิดเบราว์เซอร์ใหม่ ไม่ต้อง login ซ้ำ)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook เล็กๆ ที่ทำให้ component อื่นเรียกใช้ context นี้ได้ง่ายๆ ด้วย useAuth()
export function useAuth() {
  return useContext(AuthContext);
}
