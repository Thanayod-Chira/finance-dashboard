// ============================================================
// middleware/auth.js
// ============================================================
// "Middleware" คือฟังก์ชันที่ทำงาน "คั่นกลาง" ก่อนจะไปถึง route จริง
// ไฟล์นี้ทำหน้าที่เช็คว่า request ที่ส่งเข้ามามี "token" (บัตรผ่าน)
// ที่ถูกต้องหรือไม่ ถ้าไม่มี/ผิด จะตัดจบทันทีด้วย error 401
//
// วิธีทำงานของ JWT (JSON Web Token) แบบง่ายๆ:
// 1. ตอน login สำเร็จ เซิร์ฟเวอร์จะ "เซ็น" token ด้วยรหัสลับ (JWT_SECRET)
// 2. ฝั่ง frontend เก็บ token นี้ไว้ แล้วแนบไปกับทุก request ถัดไป
//    ใน header ชื่อ Authorization: Bearer <token>
// 3. เซิร์ฟเวอร์ตรวจสอบลายเซ็นด้วยรหัสลับตัวเดิม ถ้าตรงกัน = เชื่อถือได้
// ============================================================

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // รูปแบบ: "Bearer eyJhbGciOi..."

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่พบ token กรุณาเข้าสู่ระบบ' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId; // แปะ userId ติดไปกับ request เพื่อให้ route ถัดไปใช้ต่อได้
    next(); // ผ่าน! ไปทำงาน route จริงต่อ
  } catch (err) {
    return res.status(401).json({ error: 'token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

module.exports = { requireAuth };
