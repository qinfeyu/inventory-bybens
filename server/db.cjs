require('dotenv').config();
const path = require('path');
const fs = require('fs');

const usePostgres = !!process.env.DATABASE_URL;
let pgPool = null;
let sqliteDb = null;

if (usePostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Database Client: Connected to Supabase PostgreSQL');
} else {
  const sqlite3 = eval("require('sqlite3')").verbose();
  const dbPath = path.join(__dirname, '../database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log('Database Client: Using local SQLite database file');
}

// Map lowercase PostgreSQL column names back to camelCase properties for frontend consumption
const keyMap = {
  originalcosteur: 'originalCostEur',
  exchangerate: 'exchangeRate',
  deliverycostdzd: 'deliveryCostDzd',
  landedcostdzd: 'landedCostDzd',
  retailpricedzd: 'retailPriceDzd',
  quantitypurchased: 'quantityPurchased',
  quantitysold: 'quantitySold',
  remainingstock: 'remainingStock',
  prozislink: 'prozisLink',
  weightalloc: 'weightAlloc',
  createdat: 'createdAt',
  updatedat: 'updatedAt',
  customerid: 'customerId',
  customername: 'customerName',
  customerphone: 'customerPhone',
  customeraddress: 'customerAddress',
  totalrevenuedzd: 'totalRevenueDzd',
  totalbasecostdzd: 'totalBaseCostDzd',
  totalprofitdzd: 'totalProfitDzd',
  totalprofiteur: 'totalProfitEur',
  saleid: 'saleId',
  productid: 'productId',
  productname: 'productName',
  exchangerateused: 'exchangeRateUsed',
  preorderid: 'preOrderId',
  totaldeliverydzd: 'totalDeliveryDzd',
  totalcostdzd: 'totalCostDzd',
  amountdzd: 'amountDzd',
  amounteur: 'amountEur'
};

const mapRow = (row) => {
  if (!row) return row;
  const newRow = {};
  Object.keys(row).forEach(k => {
    const camelKey = keyMap[k] || k;
    newRow[camelKey] = row[k];
  });
  return newRow;
};

// Translates SQLite '?' placeholders to PostgreSQL '$1, $2...' format
const translateSql = (sql) => {
  let paramCount = 1;
  return sql.replace(/\?/g, () => `$${paramCount++}`);
};

const run = (sql, params = []) => {
  if (usePostgres) {
    const pgSql = translateSql(sql);
    return pgPool.query(pgSql, params)
      .then(res => ({ id: res.rows[0]?.id || null, changes: res.rowCount }))
      .catch(err => {
        console.error('PostgreSQL query execution error (run):', err.message);
        throw err;
      });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

const get = (sql, params = []) => {
  if (usePostgres) {
    const pgSql = translateSql(sql);
    return pgPool.query(pgSql, params)
      .then(res => mapRow(res.rows[0]))
      .catch(err => {
        console.error('PostgreSQL query execution error (get):', err.message);
        throw err;
      });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const all = (sql, params = []) => {
  if (usePostgres) {
    const pgSql = translateSql(sql);
    return pgPool.query(pgSql, params)
      .then(res => res.rows.map(mapRow))
      .catch(err => {
        console.error('PostgreSQL query execution error (all):', err.message);
        throw err;
      });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Initialize tables (compatible with both PostgreSQL and SQLite data types)
const initDb = async () => {
  console.log(usePostgres ? 'Initializing Supabase PostgreSQL tables...' : 'Initializing SQLite tables...');

  // 1. Products Table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      variant TEXT NOT NULL,
      size TEXT NOT NULL,
      originalCostEur REAL NOT NULL,
      exchangeRate REAL NOT NULL,
      deliveryCostDzd REAL NOT NULL,
      landedCostDzd REAL NOT NULL,
      retailPriceDzd REAL NOT NULL,
      quantityPurchased INTEGER NOT NULL,
      quantitySold INTEGER NOT NULL,
      remainingStock INTEGER NOT NULL,
      prozisLink TEXT,
      weightAlloc REAL,
      archived INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // 2. Customers Table
  await run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      instagram TEXT,
      notes TEXT
    )
  `);

  // 3. Sales Table
  await run(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      totalRevenueDzd REAL NOT NULL,
      totalBaseCostDzd REAL NOT NULL,
      totalProfitDzd REAL NOT NULL,
      totalProfitEur REAL NOT NULL,
      customerId TEXT,
      customerName TEXT,
      customerPhone TEXT,
      customerAddress TEXT,
      notes TEXT
    )
  `);

  // 4. Sale Items Table
  await run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      sellPriceDzd REAL NOT NULL,
      baseCostDzd REAL NOT NULL,
      profitDzd REAL NOT NULL,
      exchangeRateUsed REAL NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales (id) ON DELETE CASCADE
    )
  `);

  // 5. Pre-Orders Table
  await run(`
    CREATE TABLE IF NOT EXISTS pre_orders (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      customerId TEXT,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      customerAddress TEXT,
      category TEXT NOT NULL,
      totalRevenueDzd REAL NOT NULL,
      totalDeliveryDzd REAL NOT NULL,
      totalCostDzd REAL NOT NULL,
      totalProfitDzd REAL NOT NULL,
      status TEXT NOT NULL,
      notes TEXT
    )
  `);

  // 6. Pre-Order Items Table
  await run(`
    CREATE TABLE IF NOT EXISTS pre_order_items (
      id TEXT PRIMARY KEY,
      preOrderId TEXT NOT NULL,
      productId TEXT,
      productName TEXT NOT NULL,
      variant TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      originalCostEur REAL NOT NULL,
      exchangeRate REAL NOT NULL,
      deliveryCostDzd REAL NOT NULL,
      priceDzd REAL NOT NULL,
      FOREIGN KEY (preOrderId) REFERENCES pre_orders (id) ON DELETE CASCADE
    )
  `);

  // 7. Expenses Table
  await run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amountDzd REAL NOT NULL,
      amountEur REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    )
  `);

  // 8. Settings Table
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // 9. Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin'
    )
  `);
};

const seedData = async () => {
  // Ensure default admin user is seeded
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding default administrator account...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin', 10);
    await run(`
      INSERT INTO users (id, username, email, password, role)
      VALUES ('user-admin', 'admin', 'admin@poty.com', ?, 'admin')
    `, [hashedPassword]);
  }

  const productCount = await get('SELECT COUNT(*) as count FROM products');
  if (productCount.count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding initial database records...');

  // Seed Products
  const initialProducts = [
    {
      id: 'prod-1',
      sku: 'SUP-WHEY-CHOC',
      name: '100% Whey Gold Standard 2.27kg',
      brand: 'Optimum Nutrition',
      description: 'Premium whey protein isolate for muscle recovery and growth.',
      category: 'Supplements',
      variant: 'Double Rich Chocolate',
      size: '2.27 kg',
      originalCostEur: 45.00,
      exchangeRate: 250,
      deliveryCostDzd: 1200,
      landedCostDzd: 12450,
      retailPriceDzd: 17500,
      quantityPurchased: 20,
      quantitySold: 8,
      remainingStock: 12,
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-25T14:30:00Z'
    },
    {
      id: 'prod-2',
      sku: 'SUP-CREA-UNI',
      name: 'Creatine Monohydrate 250g',
      brand: 'Optimum Nutrition',
      description: 'Pure micronized creatine monohydrate for strength and power.',
      category: 'Supplements',
      variant: 'Unflavored',
      size: '250g',
      originalCostEur: 12.00,
      exchangeRate: 250,
      deliveryCostDzd: 400,
      landedCostDzd: 3400,
      retailPriceDzd: 5500,
      quantityPurchased: 30,
      quantitySold: 15,
      remainingStock: 15,
      createdAt: '2026-06-02T11:00:00Z',
      updatedAt: '2026-06-20T09:15:00Z'
    },
    {
      id: 'prod-3',
      sku: 'SNA-MELT-CARA',
      name: 'Prozis Melty Protein Bar',
      brand: 'Prozis',
      description: 'Delicious high-protein low-sugar snack bar with rich caramel layer.',
      category: 'Snacks',
      variant: 'Salted Caramel',
      size: '12x60g Box',
      originalCostEur: 15.00,
      exchangeRate: 270,
      deliveryCostDzd: 600,
      landedCostDzd: 4650,
      retailPriceDzd: 6500,
      quantityPurchased: 15,
      quantitySold: 10,
      remainingStock: 5,
      prozisLink: 'https://www.prozis.com/melty-bar',
      weightAlloc: 0.72,
      createdAt: '2026-06-03T14:00:00Z',
      updatedAt: '2026-06-28T16:20:00Z'
    }
  ];

  for (const p of initialProducts) {
    await run(`
      INSERT INTO products (id, sku, name, brand, description, category, variant, size, originalCostEur, exchangeRate, deliveryCostDzd, landedCostDzd, retailPriceDzd, quantityPurchased, quantitySold, remainingStock, prozisLink, weightAlloc, archived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [p.id, p.sku, p.name, p.brand, p.description || '', p.category, p.variant, p.size, p.originalCostEur, p.exchangeRate, p.deliveryCostDzd, p.landedCostDzd, p.retailPriceDzd, p.quantityPurchased, p.quantitySold, p.remainingStock, p.prozisLink || '', p.weightAlloc || 0, p.createdAt, p.updatedAt]);
  }

  // Seed Customers
  const initialCustomers = [
    {
      id: 'cust-1',
      name: 'Amine Rahmani',
      phone: '0555123456',
      address: 'Didouche Mourad, Algiers',
      instagram: '@amine_fit',
      notes: 'Prefers double chocolate whey, regular client.'
    },
    {
      id: 'cust-2',
      name: 'Sarah Benali',
      phone: '0770987654',
      address: 'Hydra, Algiers',
      instagram: '@sarah.active',
      notes: 'Buys Prozis protein bars and oats.'
    }
  ];

  for (const c of initialCustomers) {
    await run(`
      INSERT INTO customers (id, name, phone, address, instagram, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [c.id, c.name, c.phone, c.address, c.instagram, c.notes]);
  }

  // Seed Sales
  const initialSales = [
    {
      id: 'sale-1',
      date: '2026-06-20T10:30:00Z',
      totalRevenueDzd: 23000,
      totalBaseCostDzd: 15850,
      totalProfitDzd: 7150,
      totalProfitEur: 28.33,
      customerId: 'cust-1',
      customerName: 'Amine Rahmani',
      customerPhone: '0555123456',
      customerAddress: 'Didouche Mourad, Algiers',
      notes: 'Sale of Whey and Melty bar box',
      items: [
        {
          id: 'saleitem-1',
          productId: 'prod-1',
          productName: '100% Whey Gold Standard 2.27kg',
          category: 'Supplements',
          quantity: 1,
          sellPriceDzd: 17500,
          baseCostDzd: 12450,
          profitDzd: 5050,
          exchangeRateUsed: 250
        },
        {
          id: 'saleitem-2',
          productId: 'prod-3',
          productName: 'Prozis Melty Protein Bar',
          category: 'Snacks',
          quantity: 1,
          sellPriceDzd: 5500,
          baseCostDzd: 3400,
          profitDzd: 2100,
          exchangeRateUsed: 270
        }
      ]
    }
  ];

  for (const s of initialSales) {
    await run(`
      INSERT INTO sales (id, date, totalRevenueDzd, totalBaseCostDzd, totalProfitDzd, totalProfitEur, customerId, customerName, customerPhone, customerAddress, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [s.id, s.date, s.totalRevenueDzd, s.totalBaseCostDzd, s.totalProfitDzd, s.totalProfitEur, s.customerId, s.customerName, s.customerPhone, s.customerAddress, s.notes]);

    for (const item of s.items) {
      await run(`
        INSERT INTO sale_items (id, saleId, productId, productName, category, quantity, sellPriceDzd, baseCostDzd, profitDzd, exchangeRateUsed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.id, s.id, item.productId, item.productName, item.category, item.quantity, item.sellPriceDzd, item.baseCostDzd, item.profitDzd, item.exchangeRateUsed]);
    }
  }

  // Seed Pre-Orders
  const initialPreOrders = [
    {
      id: 'po-1',
      date: '2026-06-25T11:00:00Z',
      customerId: 'cust-2',
      customerName: 'Sarah Benali',
      customerPhone: '0770987654',
      customerAddress: 'Hydra, Algiers',
      category: 'Supplements',
      totalRevenueDzd: 16500,
      totalDeliveryDzd: 1200,
      totalCostDzd: 10200,
      totalProfitDzd: 6300,
      status: 'Sourced',
      notes: 'Waiting for shipment arrival',
      items: [
        {
          id: 'poitem-2',
          productId: 'prod-2',
          productName: 'Creatine Monohydrate 250g',
          variant: 'Unflavored',
          size: '250g',
          quantity: 3,
          originalCostEur: 12.00,
          exchangeRate: 250,
          deliveryCostDzd: 400,
          priceDzd: 5500
        }
      ]
    }
  ];

  for (const po of initialPreOrders) {
    await run(`
      INSERT INTO pre_orders (id, date, customerId, customerName, customerPhone, customerAddress, category, totalRevenueDzd, totalDeliveryDzd, totalCostDzd, totalProfitDzd, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [po.id, po.date, po.customerId, po.customerName, po.customerPhone, po.customerAddress, po.category, po.totalRevenueDzd, po.totalDeliveryDzd, po.totalCostDzd, po.totalProfitDzd, po.status, po.notes]);

    for (const item of po.items) {
      await run(`
        INSERT INTO pre_order_items (id, preOrderId, productId, productName, variant, size, quantity, originalCostEur, exchangeRate, deliveryCostDzd, priceDzd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.id, po.id, item.productId, item.productName, item.variant, item.size, item.quantity, item.originalCostEur, item.exchangeRate, item.deliveryCostDzd, item.priceDzd]);
    }
  }

  // Seed Expenses
  const initialExpenses = [
    {
      id: 'exp-1',
      title: 'Instagram Ads - June Campaign',
      category: 'Ad Spend',
      amountEur: 100.00,
      amountDzd: 27500,
      date: '2026-06-15T18:00:00Z',
      notes: 'Targeting fitness demographics in Algiers'
    },
    {
      id: 'exp-2',
      title: 'Cargo Delivery from Prozis (France)',
      category: 'Cargo/Shipping',
      amountEur: 150.00,
      amountDzd: 41250,
      date: '2026-06-10T12:00:00Z',
      notes: 'Shipping cost for Supplements and Snacks package'
    }
  ];

  for (const e of initialExpenses) {
    await run(`
      INSERT INTO expenses (id, title, category, amountDzd, amountEur, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [e.id, e.title, e.category, e.amountDzd, e.amountEur, e.date, e.notes]);
  }

  // Seed Settings
  await run(`
    INSERT INTO settings (key, value) VALUES ('exchangeRates', ?)
    ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
  `, [JSON.stringify({ global: 275 })]);

  await run(`
    INSERT INTO settings (key, value) VALUES ('capitalAllocation', ?)
    ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
  `, [JSON.stringify({ takenAsidePercent: 30, reinvestedPercent: 70 })]);

  console.log('Database seeding completed successfully.');
};

module.exports = {
  db: sqliteDb, // Keep for backward compatibility with index.cjs exports
  initDb,
  seedData,
  run,
  get,
  all
};
