-- POTY Business Portal - Supabase PostgreSQL Database Schema
-- Execute this script inside the Supabase SQL Editor to initialize your database tables.

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  variant TEXT NOT NULL,
  size TEXT NOT NULL,
  originalcosteur DOUBLE PRECISION NOT NULL,
  exchangerate DOUBLE PRECISION NOT NULL,
  deliverycostdzd DOUBLE PRECISION NOT NULL,
  landedcostdzd DOUBLE PRECISION NOT NULL,
  retailpricedzd DOUBLE PRECISION NOT NULL,
  quantitypurchased INTEGER NOT NULL,
  quantitysold INTEGER NOT NULL,
  remainingstock INTEGER NOT NULL,
  prozislink TEXT,
  weightalloc DOUBLE PRECISION,
  archived INTEGER DEFAULT 0,
  createdat TEXT NOT NULL,
  updatedat TEXT NOT NULL
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  instagram TEXT,
  notes TEXT
);

-- 3. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  totalrevenuedzd DOUBLE PRECISION NOT NULL,
  totalbasecostdzd DOUBLE PRECISION NOT NULL,
  totalprofitdzd DOUBLE PRECISION NOT NULL,
  totalprofiteur DOUBLE PRECISION NOT NULL,
  customerid TEXT,
  customername TEXT,
  customerphone TEXT,
  customeraddress TEXT,
  notes TEXT
);

-- 4. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  saleid TEXT NOT NULL,
  productid TEXT NOT NULL,
  productname TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  sellpricedzd DOUBLE PRECISION NOT NULL,
  basecostdzd DOUBLE PRECISION NOT NULL,
  profitdzd DOUBLE PRECISION NOT NULL,
  exchangerateused DOUBLE PRECISION NOT NULL,
  CONSTRAINT fk_sale FOREIGN KEY (saleid) REFERENCES sales (id) ON DELETE CASCADE
);

-- 5. Pre-Orders Table
CREATE TABLE IF NOT EXISTS pre_orders (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  customerid TEXT,
  customername TEXT NOT NULL,
  customerphone TEXT,
  customeraddress TEXT,
  category TEXT NOT NULL,
  totalrevenuedzd DOUBLE PRECISION NOT NULL,
  totaldeliverydzd DOUBLE PRECISION NOT NULL,
  totalcostdzd DOUBLE PRECISION NOT NULL,
  totalprofitdzd DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL,
  notes TEXT
);

-- 6. Pre-Order Items Table
CREATE TABLE IF NOT EXISTS pre_order_items (
  id TEXT PRIMARY KEY,
  preorderid TEXT NOT NULL,
  productid TEXT,
  productname TEXT NOT NULL,
  variant TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  originalcosteur DOUBLE PRECISION NOT NULL,
  exchangerate DOUBLE PRECISION NOT NULL,
  deliverycostdzd DOUBLE PRECISION NOT NULL,
  pricedzd DOUBLE PRECISION NOT NULL,
  CONSTRAINT fk_preorder FOREIGN KEY (preorderid) REFERENCES pre_orders (id) ON DELETE CASCADE
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amountdzd DOUBLE PRECISION NOT NULL,
  amounteur DOUBLE PRECISION NOT NULL,
  date TEXT NOT NULL,
  notes TEXT
);

-- 8. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
