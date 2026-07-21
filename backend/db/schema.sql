-- ============================================================
-- FINANCE DASHBOARD - DATABASE SCHEMA
-- ============================================================
-- ไฟล์นี้คือ "พิมพ์เขียว" ของฐานข้อมูล เราจะรันไฟล์นี้ครั้งเดียว
-- เพื่อสร้างตาราง (table) ทั้งหมดที่โปรแกรมต้องใช้
--
-- แนวคิด: ฐานข้อมูล 1 ตัว มีได้หลายผู้ใช้ (users) แต่ละผู้ใช้
-- จะมีข้อมูลของตัวเอง (transactions, budgets, ฯลฯ) แยกกันด้วย user_id
-- ============================================================

-- เปิดใช้ extension สำหรับสร้างรหัส UUID แบบสุ่ม (ใช้แทน id แบบเลขนับ 1,2,3)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1) USERS - ผู้ใช้งานระบบ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,          -- เก็บรหัสผ่านแบบเข้ารหัสเท่านั้น ห้ามเก็บ plain text
    full_name     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2) CATEGORIES - หมวดหมู่รายรับ/รายจ่าย (เช่น อาหาร, เดินทาง, เงินเดือน)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    color      VARCHAR(7) DEFAULT '#4C6E5D',   -- สีที่ใช้แสดงในกราฟ (hex code)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name, type)
);

-- ------------------------------------------------------------
-- 3) TRANSACTIONS - ธุรกรรมรายรับ-รายจ่ายทุกรายการ (หัวใจของ "spending tracking")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    description VARCHAR(255),
    txn_date    DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, txn_date);

-- ------------------------------------------------------------
-- 4) BUDGETS - งบประมาณต่อหมวดหมู่ต่อเดือน
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_year   DATE NOT NULL,          -- เก็บเป็นวันที่ 1 ของเดือนนั้นเสมอ เช่น 2026-07-01
    monthly_limit NUMERIC(14,2) NOT NULL CHECK (monthly_limit >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id, month_year)
);

-- ------------------------------------------------------------
-- 5) SUBSCRIPTIONS - ค่าสมัครสมาชิกรายเดือน/รายปี (Netflix, Spotify ฯลฯ)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name              VARCHAR(150) NOT NULL,
    amount            NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    billing_cycle     VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
    next_billing_date DATE NOT NULL,
    category          VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6) RECURRING BILLS - บิลที่ต้องจ่ายประจำ (ค่าไฟ ค่าน้ำ ค่าเช่า ผ่อนบ้าน ฯลฯ)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_bills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    due_day     SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),  -- วันที่ครบกำหนดของทุกเดือน
    category    VARCHAR(100),
    is_autopay  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 7) INVESTMENTS - เงินลงทุน (หุ้น กองทุน คริปโต ทองคำ ฯลฯ)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,          -- เช่น "SET50 Index Fund"
    asset_type      VARCHAR(50) NOT NULL,           -- stock, fund, crypto, gold, bond, other
    amount_invested NUMERIC(14,2) NOT NULL CHECK (amount_invested >= 0),  -- เงินต้นที่ลงไป
    current_value   NUMERIC(14,2) NOT NULL CHECK (current_value >= 0),   -- มูลค่าปัจจุบัน
    purchase_date   DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8) FINANCIAL GOALS - เป้าหมายทางการเงิน (ซื้อบ้าน, กองทุนฉุกเฉิน, ท่องเที่ยว)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_goals (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(150) NOT NULL,
    target_amount  NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    target_date    DATE,
    icon           VARCHAR(50) DEFAULT 'target',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- จบไฟล์ schema.sql
-- ============================================================
