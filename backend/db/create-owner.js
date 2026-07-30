require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // สร้าง user เจ้าของระบบ (ถ้ามีอยู่แล้วข้ามไป)
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ('owner@local', 'none', 'เจ้าของ')
     ON CONFLICT (email) DO NOTHING`
  );
  const result = await pool.query(`SELECT id FROM users WHERE email = 'owner@local'`);
  console.log(result.rows[0].id);
  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
