-- ============================================================
-- FINANCE DASHBOARD - DATABASE SCHEMA (Personal Use)
-- ============================================================
-- ใช้สำหรับคนเดียว ไม่มีระบบ user จึงไม่มี user_id ในทุกตาราง
-- ============================================================

-- เปิดใช้ extension สำหรับสร้างรหัส UUID แบบสุ่ม
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1) CATEGORIES - หมวดหมู่รายรับ/รายจ่าย (เช่น อาหาร, เดินทาง, เงินเดือน)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    color      VARCHAR(7) DEFAULT '#4C6E5D',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, type)
);

-- ------------------------------------------------------------
-- 2) TRANSACTIONS - ธุรกรรมรายรับ-รายจ่าย
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    description VARCHAR(255),
    txn_date    DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(txn_date);

-- ------------------------------------------------------------
-- 3) BUDGETS - งบประมาณต่อหมวดหมู่ต่อเดือน
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_year    DATE NOT NULL,
    monthly_limit NUMERIC(14,2) NOT NULL CHECK (monthly_limit >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (category_id, month_year)
);

-- ------------------------------------------------------------
-- 4) SUBSCRIPTIONS - ค่าสมัครสมาชิกรายเดือน/รายปี
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(150) NOT NULL,
    amount            NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    billing_cycle     VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
    next_billing_date DATE NOT NULL,
    category          VARCHAR(100),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5) RECURRING BILLS - บิลที่ต้องจ่ายประจำ
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_bills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    due_day     SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    category    VARCHAR(100),
    is_autopay  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6) INVESTMENTS - เงินลงทุน
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    asset_type      VARCHAR(50) NOT NULL,
    amount_invested NUMERIC(14,2) NOT NULL CHECK (amount_invested >= 0),
    purchase_date   DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 7) FINANCIAL GOALS - เป้าหมายทางการเงิน
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_goals (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
