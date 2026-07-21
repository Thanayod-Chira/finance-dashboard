# Ledger — Personal Finance Dashboard

โปรแกรมติดตามการเงินส่วนตัว: รายรับ-รายจ่าย, งบประมาณ, สมาชิกรายเดือน, บิลประจำ,
การลงทุน และเป้าหมายทางการเงิน พร้อมกราฟวิเคราะห์

**Stack:** React (Vite) + Node.js (Express) + PostgreSQL

คู่มือนี้เขียนสำหรับคนที่ **ไม่เคยเขียนโปรแกรมมาก่อน** ทำตามทีละขั้นตอนได้เลย

---

## 0. ภาพรวมสถาปัตยกรรม (เข้าใจก่อนเริ่ม)

```
เบราว์เซอร์ (React)  <-- HTTP/JSON -->  Backend (Node.js/Express)  <-- SQL -->  PostgreSQL
     "หน้าตาแอป"                         "สมองที่ประมวลผล"                    "ที่เก็บข้อมูลถาวร"
```

- **React (frontend)**: โค้ดที่รันในเบราว์เซอร์ของผู้ใช้ วาดปุ่ม ฟอร์ม กราฟ ทั้งหมด
- **Node.js/Express (backend)**: โปรแกรมที่รันบนเซิร์ฟเวอร์ (หรือเครื่องคุณตอน dev) รับคำขอจาก
  frontend ผ่าน **REST API** (เช่น `GET /api/transactions`) แล้วไปอ่าน/เขียนฐานข้อมูล
- **PostgreSQL (database)**: ที่เก็บข้อมูลจริงแบบถาวร เป็นตารางๆ (users, transactions, ...)

ทั้งสามส่วนนี้เป็นโปรแกรมคนละตัว รันคนละ process กัน แต่คุยกันผ่านเครือข่าย (network)
นี่คือสถาปัตยกรรมมาตรฐานของเว็บแอปสมัยใหม่เกือบทุกตัว

---

## 1. ติดตั้งเครื่องมือที่ต้องใช้ (ทำครั้งเดียว)

### 1.1 ติดตั้ง Node.js
Node.js คือโปรแกรมที่ทำให้เครื่องคุณรันโค้ด JavaScript นอกเบราว์เซอร์ได้ (ใช้ทั้งฝั่ง backend
และใช้เป็นเครื่องมือ build ฝั่ง frontend)

1. ไปที่ https://nodejs.org แล้วดาวน์โหลดเวอร์ชัน **LTS** (เวอร์ชันเสถียร)
2. ติดตั้งตามขั้นตอนปกติ (Next > Next > Install)
3. เปิด Terminal (Mac: Terminal.app, Windows: PowerShell) แล้วพิมพ์เพื่อเช็คว่าติดตั้งสำเร็จ:
   ```bash
   node -v
   npm -v
   ```
   ถ้าขึ้นเลขเวอร์ชัน (เช่น v20.11.0) แปลว่าติดตั้งสำเร็จ

### 1.2 ติดตั้ง PostgreSQL
1. ไปที่ https://www.postgresql.org/download/ เลือกระบบปฏิบัติการของคุณ
2. ติดตั้งตามขั้นตอน **จำรหัสผ่านของ user "postgres" ที่ตั้งตอนติดตั้งให้ดี** จะใช้ตอนต่อไป
3. โปรแกรมจะติดตั้ง **pgAdmin** มาด้วย (โปรแกรมหน้าตา GUI ไว้ดูฐานข้อมูล) — เปิดใช้ดูข้อมูลได้สะดวก
4. เช็คว่าติดตั้งสำเร็จโดยเปิด Terminal พิมพ์:
   ```bash
   psql --version
   ```

### 1.3 สร้างฐานข้อมูลเปล่าๆ ไว้รอ
เปิด Terminal แล้วพิมพ์ (จะถูกถามรหัสผ่านที่ตั้งไว้ตอนติดตั้ง):
```bash
psql -U postgres -c "CREATE DATABASE finance_dashboard;"
```
ถ้าคำสั่งนี้ error เรื่อง path ไม่เจอ `psql` ให้ลองเปิดผ่านโปรแกรม **pgAdmin** แทน
แล้วคลิกขวาที่ "Databases" > Create > Database... ตั้งชื่อ `finance_dashboard`

### 1.4 (ทางเลือก) ติดตั้ง VS Code
โปรแกรมแก้ไขโค้ดที่ใช้ง่ายและฟรี: https://code.visualstudio.com

---

## 2. ตั้งค่าโปรเจกต์

โครงสร้างไฟล์ทั้งหมด:
```
finance-dashboard/
├── backend/          <- Node.js API server
│   ├── db/
│   │   ├── schema.sql   <- คำสั่งสร้างตารางฐานข้อมูล
│   │   ├── pool.js      <- การเชื่อมต่อฐานข้อมูล
│   │   └── setup.js     <- สคริปต์รัน schema.sql อัตโนมัติ
│   ├── middleware/auth.js
│   ├── routes/           <- endpoint ของ API แต่ละกลุ่ม
│   ├── server.js         <- จุดเริ่มโปรแกรม
│   ├── package.json
│   └── .env.example
└── frontend/         <- React app
    ├── src/
    │   ├── pages/         <- แต่ละหน้าจอ
    │   ├── components/    <- ชิ้นส่วน UI ที่ใช้ซ้ำ
    │   ├── api/client.js  <- ฟังก์ชันเรียก API ทั้งหมด
    │   └── styles/index.css
    ├── package.json
    └── vite.config.js
```

### 2.1 ตั้งค่า Backend

เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ backend:
```bash
cd finance-dashboard/backend
npm install
```
คำสั่ง `npm install` จะอ่านไฟล์ `package.json` แล้วดาวน์โหลด library ที่จำเป็นทั้งหมด
(express, pg, jsonwebtoken ฯลฯ) มาไว้ในโฟลเดอร์ `node_modules`

จากนั้นสร้างไฟล์ตั้งค่า `.env` โดยคัดลอกจากตัวอย่าง:
```bash
cp .env.example .env
```
เปิดไฟล์ `.env` ด้วย VS Code แล้วแก้บรรทัด `DATABASE_URL` ให้ตรงกับรหัสผ่าน PostgreSQL ของคุณ เช่น:
```
DATABASE_URL=postgresql://postgres:รหัสผ่านของคุณ@localhost:5432/finance_dashboard
```
และเปลี่ยน `JWT_SECRET` เป็นข้อความยาวๆ สุ่มๆ (จะได้ token ที่ปลอดภัย) — รันคำสั่งนี้เพื่อสุ่มให้อัตโนมัติ:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
แล้วคัดลอกผลลัพธ์ไปวางแทนค่า `JWT_SECRET` ใน `.env`

**สร้างตารางในฐานข้อมูล** (รันครั้งเดียว):
```bash
npm run db:setup
```
ถ้าเห็นข้อความ `✅ สร้างตารางเรียบร้อยแล้ว` แปลว่าสำเร็จ

**เปิด backend server:**
```bash
npm run dev
```
ถ้าเห็น `🚀 Backend server กำลังทำงานที่ http://localhost:4000` แปลว่าสำเร็จ **เปิด Terminal
หน้าต่างนี้ทิ้งไว้แบบนี้ ห้ามปิด**

### 2.2 ตั้งค่า Frontend

เปิด Terminal **หน้าต่างใหม่อีกอัน** (ไม่ใช่หน้าต่างเดิมที่รัน backend อยู่) แล้ว:
```bash
cd finance-dashboard/frontend
npm install
npm run dev
```
Vite จะขึ้นข้อความบอก URL เช่น `http://localhost:5173/` — เปิดลิงก์นี้ในเบราว์เซอร์

ตอนนี้คุณควรเห็นหน้า **สมัครสมาชิก** ของแอป — กดสมัครสมาชิกด้วยอีเมล/รหัสผ่านอะไรก็ได้
(เป็นข้อมูลในเครื่องคุณเอง) แล้วเริ่มใช้งานได้เลย

> **สรุป:** ต้องเปิด Terminal 2 หน้าต่างพร้อมกันเสมอตอน dev — หนึ่งรัน backend (port 4000)
> อีกหนึ่งรัน frontend (port 5173) ตัว frontend จะส่ง request ไปหา backend อัตโนมัติผ่าน
> การตั้งค่า proxy ใน `vite.config.js`

---

## 3. เข้าใจโค้ดทีละส่วน

### 3.1 ฐานข้อมูล (`backend/db/schema.sql`)
ทุกตารางมี `user_id` เพื่อแยกข้อมูลของแต่ละคนไม่ให้ปนกัน และใช้ `REFERENCES users(id)`
เพื่อบังคับว่าแถวข้อมูลนี้ต้องผูกกับผู้ใช้ที่มีอยู่จริงเท่านั้น (เรียกว่า *foreign key*)
ทุกไฟล์มีคอมเมนต์ภาษาไทยอธิบายแต่ละตารางกำกับไว้แล้ว

### 3.2 Backend API (`backend/routes/*.js`)
แต่ละไฟล์ในโฟลเดอร์ `routes/` คือกลุ่ม endpoint ของหนึ่งฟีเจอร์ เช่น `transactions.js`
จัดการ path `/api/transactions` ทั้งหมด รูปแบบมาตรฐานที่ใช้ซ้ำทุกไฟล์คือ **REST**:

| HTTP Method | ความหมาย | ตัวอย่าง |
|---|---|---|
| GET    | ขอดูข้อมูล      | `GET /api/transactions` = ดูรายการทั้งหมด |
| POST   | สร้างข้อมูลใหม่  | `POST /api/transactions` = เพิ่มรายการ |
| PUT    | แก้ไขข้อมูลทั้งก้อน | `PUT /api/transactions/:id` = แก้รายการ |
| PATCH  | แก้ไขบางส่วน     | `PATCH /api/investments/:id/value` = แก้แค่มูลค่า |
| DELETE | ลบข้อมูล        | `DELETE /api/transactions/:id` = ลบรายการ |

ทุก route (ยกเว้น login/register) ถูกครอบด้วย `requireAuth` middleware (ดูใน `server.js`)
ซึ่งเช็ค token ก่อนเสมอ ถ้า token ไม่ถูกต้องจะตอบ error 401 กลับไปทันที โดยไม่รันโค้ดข้างในเลย

**ทำไมต้องใช้ `$1, $2, ...` ใน SQL แทนการต่อ string ตรงๆ?**
เพื่อป้องกัน **SQL Injection** (การโจมตีที่แฮ็กเกอร์ใส่โค้ด SQL ปลอมลงในช่องกรอกข้อมูล)
`pg` library จะจัดการ escape ค่าที่ส่งเข้ามาให้อัตโนมัติเมื่อใช้ placeholder แบบนี้

### 3.3 Frontend (`frontend/src/pages/*.jsx`)
ทุกหน้าจอมีรูปแบบเดียวกัน:
1. `useState` — เก็บข้อมูลที่หน้าจอต้อง "จำ" เช่น รายการ transactions, ค่าฟอร์มที่พิมพ์อยู่
2. `useEffect` — ดึงข้อมูลจาก API ตอนหน้าจอเพิ่งโหลด (หรือเมื่อเดือนที่เลือกเปลี่ยน)
3. ฟังก์ชัน `handleXxx` — ทำงานเมื่อผู้ใช้กดปุ่ม/ส่งฟอร์ม แล้วเรียก API แล้ว `refresh()` ข้อมูลใหม่
4. ส่วน `return (...)` — JSX ที่อธิบายว่าหน้าจอควรหน้าตายังไง โดยอ้างอิงจากค่าใน state

ตัวอย่างการอ่านโค้ดใน `Spending.jsx`:
```jsx
const [transactions, setTransactions] = useState([]); // "กล่องเก็บของ" ชื่อ transactions

useEffect(() => {
  refresh(); // พอหน้าโหลดเสร็จ หรือ month เปลี่ยน -> ไปขอข้อมูลใหม่จาก backend
}, [month]);
```
ทุกครั้งที่ `setTransactions(...)` ถูกเรียก React จะวาดหน้าจอใหม่ให้ตรงกับข้อมูลล่าสุดอัตโนมัติ
— นี่คือหัวใจของ React: **UI = ฟังก์ชันของ state**

### 3.4 การเชื่อม Frontend ↔ Backend (`frontend/src/api/client.js`)
ไฟล์นี้รวมทุกการเรียก API ไว้ที่เดียว ทุกหน้าจอ import ฟังก์ชันจากที่นี่แทนที่จะเขียน
`axios.get(...)` กระจายอยู่ทั่วโปรเจกต์ ทำให้ถ้าต้อง endpoint เปลี่ยน แก้ที่เดียวจบ
นอกจากนี้ยังมี **interceptor** ที่แปะ token ติดไปกับทุก request อัตโนมัติ (ดูคอมเมนต์ในไฟล์)

### 3.5 Authentication (การล็อกอิน)
1. สมัคร/ล็อกอิน → backend เข้ารหัสรหัสผ่านด้วย **bcrypt** แล้วออก **JWT token** กลับมา
2. frontend เก็บ token ไว้ใน `localStorage` (ที่เก็บข้อมูลถาวรในเบราว์เซอร์)
3. ทุก request ถัดไปจะแนบ token ไปใน header `Authorization: Bearer <token>`
4. backend ตรวจสอบ token ทุกครั้งก่อนจะให้เข้าถึงข้อมูล — ทำให้แต่ละคนเห็นแค่ข้อมูลของตัวเอง

---

## 4. การใช้งานแอป

- **ภาพรวม (Dashboard)**: สรุปรายรับ-รายจ่ายเดือนนี้, กราฟวงกลมสัดส่วนรายจ่าย, กราฟเส้นแนวโน้ม
  6 เดือน, รายการที่ใกล้ครบกำหนดจ่าย
- **รายรับ-รายจ่าย**: บันทึกทุกธุรกรรม เลือกเดือนดูย้อนหลังได้, สร้างหมวดหมู่เองได้
- **งบประมาณ**: ตั้งวงเงินต่อหมวดหมู่ต่อเดือน ระบบคำนวณให้อัตโนมัติว่าใช้ไปเท่าไหร่แล้ว
- **สมาชิกรายเดือน**: ติดตาม Netflix, Spotify ฯลฯ พร้อมวันที่เรียกเก็บเงินครั้งถัดไป
- **บิลประจำ**: ค่าไฟ ค่าน้ำ ค่าเช่า ที่ต้องจ่ายทุกเดือน
- **การลงทุน**: บันทึกเงินลงทุน อัปเดตมูลค่าปัจจุบันเป็นระยะเพื่อดูกำไร/ขาดทุน
- **เป้าหมาย**: ตั้งเป้าหมายเงิน (เช่น กองทุนฉุกเฉิน) แล้วค่อยๆ เติมเงินเข้าไปดูความคืบหน้า

---

## 5. ปัญหาที่พบบ่อย (Troubleshooting)

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| `❌ เชื่อมต่อ PostgreSQL ไม่สำเร็จ` | รหัสผ่าน/ชื่อฐานข้อมูลใน `.env` ผิด หรือ PostgreSQL ไม่ได้รันอยู่ | เช็คค่า `DATABASE_URL`, เช็คว่า PostgreSQL service เปิดอยู่ |
| หน้าเว็บขึ้น "Network Error" ตอนกดปุ่ม | backend ไม่ได้รันอยู่ | เช็คว่า Terminal ที่รัน `npm run dev` ในโฟลเดอร์ backend ยังเปิดอยู่ |
| `EADDRINUSE: port already in use` | มีโปรแกรมอื่นใช้ port 4000/5173 อยู่แล้ว | ปิดโปรแกรมนั้น หรือเปลี่ยน `PORT` ใน `.env` |
| ล็อกอินไม่ได้ / token error | ยังไม่ได้รัน `npm run db:setup` หรือ `.env` ไม่มีไฟล์ | เช็คว่ามีไฟล์ `.env` และรัน db:setup แล้ว |

---

## 6. ขั้นต่อไป (แนะนำถ้าอยากต่อยอด)
- Deploy จริง: backend ขึ้น Render/Railway, database ขึ้น Supabase/Neon, frontend ขึ้น Vercel/Netlify
- เพิ่มการ export ข้อมูลเป็น CSV/Excel
- เพิ่มการแจ้งเตือนก่อนถึงวันครบกำหนดบิล (ต้องใช้ email service เช่น Resend/SendGrid)
- เพิ่ม dark mode
