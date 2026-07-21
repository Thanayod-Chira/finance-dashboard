// ============================================================
// server.js - จุดเริ่มต้นของ backend
// ============================================================
// นี่คือไฟล์ที่เรารันด้วยคำสั่ง `node server.js` (หรือ `npm run dev`)
// หน้าที่ของมัน:
//  1. สร้างเซิร์ฟเวอร์ Express
//  2. ติดตั้ง middleware กลาง (cors, json parser)
//  3. เชื่อม route แต่ละกลุ่มเข้ากับ path ของมัน เช่น /api/transactions
//  4. เปิดฟังที่ port ที่กำหนด
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const subscriptionRoutes = require('./routes/subscriptions');
const billRoutes = require('./routes/bills');
const investmentRoutes = require('./routes/investments');
const goalRoutes = require('./routes/goals');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// ---- Middleware กลาง ----
app.use(cors());          // อนุญาตให้ frontend (คนละ port) เรียก API นี้ได้
app.use(express.json());  // แปลง request body ที่เป็น JSON ให้กลายเป็น req.body อัตโนมัติ

// ---- Health check (เช็คว่าเซิร์ฟเวอร์ยังมีชีวิตอยู่ไหม) ----
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---- Public routes (ไม่ต้อง login ก็เรียกได้) ----
app.use('/api/auth', authRoutes);

// ---- Protected routes (ต้องแนบ token ทุก request) ----
// requireAuth คั่นอยู่ตรงนี้ = ทุก route ข้างล่างนี้ต้อง login ก่อนถึงจะใช้ได้
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/budgets', requireAuth, budgetRoutes);
app.use('/api/subscriptions', requireAuth, subscriptionRoutes);
app.use('/api/bills', requireAuth, billRoutes);
app.use('/api/investments', requireAuth, investmentRoutes);
app.use('/api/goals', requireAuth, goalRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);

// ---- Error handler กลาง (ดักจับ error ที่หลุดมาจาก route ไหนก็ตาม) ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server กำลังทำงานที่ http://localhost:${PORT}`);
});
