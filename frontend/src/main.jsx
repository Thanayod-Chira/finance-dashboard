// ============================================================
// main.jsx - จุดเริ่มต้นของฝั่ง React
// ============================================================
// ไฟล์นี้ทำหน้าที่แค่อย่างเดียว: หา <div id="root"> ใน index.html
// แล้ว "วาด" (render) component <App /> ลงไปข้างใน
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter เปิดใช้งานระบบเปลี่ยนหน้า (routing) ทั้งแอป */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
