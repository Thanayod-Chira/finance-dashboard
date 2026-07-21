// ============================================================
// db/setup.js
// ============================================================
// สคริปต์ช่วยรัน schema.sql ให้อัตโนมัติ แทนการพิมพ์คำสั่ง SQL เอง
// ใช้งาน: npm run db:setup   (รันจากโฟลเดอร์ backend)
// ============================================================
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('⏳ กำลังสร้างตารางจาก schema.sql ...');
  await pool.query(sql);
  console.log('✅ สร้างตารางเรียบร้อยแล้ว! ฐานข้อมูลพร้อมใช้งาน');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ เกิดข้อผิดพลาดตอนสร้างตาราง:', err.message);
  process.exit(1);
});
