// db/reset.js - ลบตารางทั้งหมดแล้วสร้างใหม่จาก schema.sql
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('🗑️  กำลังลบตารางเก่า...');
  await pool.query(`
    DROP TABLE IF EXISTS financial_goals CASCADE;
    DROP TABLE IF EXISTS investments CASCADE;
    DROP TABLE IF EXISTS recurring_bills CASCADE;
    DROP TABLE IF EXISTS subscriptions CASCADE;
    DROP TABLE IF EXISTS budgets CASCADE;
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  console.log('✅ ลบตารางเก่าเรียบร้อย');

  console.log('⏳ กำลังสร้างตารางใหม่จาก schema.sql...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ สร้างตารางใหม่เรียบร้อย ฐานข้อมูลพร้อมใช้งาน');

  await pool.end();
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
