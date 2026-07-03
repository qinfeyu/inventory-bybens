require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dbHelper = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database (only locally for SQLite, Supabase uses manual schema execution)
if (!process.env.DATABASE_URL) {
  dbHelper.initDb().catch(err => {
    console.error('Failed to initialize local SQLite database:', err);
  });
}

// --- API Routes ---

// 1. Products API
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbHelper.all('SELECT * FROM products ORDER BY createdAt DESC');
    // Map archived integer back to boolean
    const mapped = products.map(p => ({
      ...p,
      archived: !!p.archived
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const p = req.body;
  try {
    await dbHelper.run(`
      INSERT INTO products (id, sku, name, brand, description, category, variant, size, originalCostEur, exchangeRate, deliveryCostDzd, landedCostDzd, retailPriceDzd, quantityPurchased, quantitySold, remainingStock, prozisLink, weightAlloc, archived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [p.id, p.sku, p.name, p.brand, p.description, p.category, p.variant, p.size, p.originalCostEur, p.exchangeRate, p.deliveryCostDzd, p.landedCostDzd, p.retailPriceDzd, p.quantityPurchased, p.quantitySold, p.remainingStock, p.prozisLink, p.weightAlloc, p.createdAt, p.updatedAt]);
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/bulk', async (req, res) => {
  const products = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Body must be an array of products' });
  }
  try {
    await dbHelper.run('BEGIN TRANSACTION');
    for (const p of products) {
      await dbHelper.run(`
        INSERT INTO products (id, sku, name, brand, description, category, variant, size, originalCostEur, exchangeRate, deliveryCostDzd, landedCostDzd, retailPriceDzd, quantityPurchased, quantitySold, remainingStock, prozisLink, weightAlloc, archived, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(sku) DO UPDATE SET
          name = excluded.name,
          brand = excluded.brand,
          description = excluded.description,
          category = excluded.category,
          variant = excluded.variant,
          size = excluded.size,
          originalCostEur = excluded.originalCostEur,
          exchangeRate = excluded.exchangeRate,
          deliveryCostDzd = excluded.deliveryCostDzd,
          landedCostDzd = excluded.landedCostDzd,
          retailPriceDzd = excluded.retailPriceDzd,
          quantityPurchased = excluded.quantityPurchased,
          quantitySold = excluded.quantitySold,
          remainingStock = excluded.remainingStock,
          prozisLink = excluded.prozisLink,
          weightAlloc = excluded.weightAlloc,
          updatedAt = excluded.updatedAt
      `, [
        p.id, p.sku, p.name, p.brand, p.description || '', p.category, p.variant, p.size,
        p.originalCostEur, p.exchangeRate, p.deliveryCostDzd, p.landedCostDzd, p.retailPriceDzd,
        p.quantityPurchased, p.quantitySold || 0, p.remainingStock, p.prozisLink || '', p.weightAlloc || 0,
        p.createdAt, p.updatedAt
      ]);
    }
    await dbHelper.run('COMMIT');
    res.status(201).json(products);
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const p = req.body;
  try {
    await dbHelper.run(`
      UPDATE products
      SET sku = ?, name = ?, brand = ?, description = ?, category = ?, variant = ?, size = ?, originalCostEur = ?, exchangeRate = ?, deliveryCostDzd = ?, landedCostDzd = ?, retailPriceDzd = ?, quantityPurchased = ?, quantitySold = ?, remainingStock = ?, prozisLink = ?, weightAlloc = ?, archived = ?, updatedAt = ?
      WHERE id = ?
    `, [p.sku, p.name, p.brand, p.description, p.category, p.variant, p.size, p.originalCostEur, p.exchangeRate, p.deliveryCostDzd, p.landedCostDzd, p.retailPriceDzd, p.quantityPurchased, p.quantitySold, p.remainingStock, p.prozisLink, p.weightAlloc, p.archived ? 1 : 0, p.updatedAt, id]);
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Archive product
    await dbHelper.run('UPDATE products SET archived = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await dbHelper.all('SELECT * FROM customers ORDER BY name ASC');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const c = req.body;
  try {
    await dbHelper.run(`
      INSERT INTO customers (id, name, phone, address, instagram, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [c.id, c.name, c.phone, c.address, c.instagram, c.notes]);
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  try {
    await dbHelper.run(`
      UPDATE customers
      SET name = ?, phone = ?, address = ?, instagram = ?, notes = ?
      WHERE id = ?
    `, [c.name, c.phone, c.address, c.instagram, c.notes, id]);
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbHelper.run('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Sales API (Multi-item)
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await dbHelper.all('SELECT * FROM sales ORDER BY date DESC');
    const items = await dbHelper.all('SELECT * FROM sale_items');
    
    // Group items by saleId
    const salesWithItems = sales.map(s => ({
      ...s,
      items: items.filter(item => item.saleId === s.id)
    }));
    res.json(salesWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  const s = req.body;
  try {
    // Start Transaction manually
    await dbHelper.run('BEGIN TRANSACTION');

    await dbHelper.run(`
      INSERT INTO sales (id, date, totalRevenueDzd, totalBaseCostDzd, totalProfitDzd, totalProfitEur, customerId, customerName, customerPhone, customerAddress, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [s.id, s.date, s.totalRevenueDzd, s.totalBaseCostDzd, s.totalProfitDzd, s.totalProfitEur, s.customerId, s.customerName, s.customerPhone, s.customerAddress, s.notes]);

    for (const item of s.items) {
      const itemId = `sitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await dbHelper.run(`
        INSERT INTO sale_items (id, saleId, productId, productName, category, quantity, sellPriceDzd, baseCostDzd, profitDzd, exchangeRateUsed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [itemId, s.id, item.productId, item.productName, item.category, item.quantity, item.sellPriceDzd, item.baseCostDzd, item.profitDzd, item.exchangeRateUsed]);

      // Decrement product stock
      await dbHelper.run(`
        UPDATE products
        SET quantitySold = quantitySold + ?, remainingStock = remainingStock - ?, updatedAt = ?
        WHERE id = ?
      `, [item.quantity, item.quantity, new Date().toISOString(), item.productId]);
    }

    await dbHelper.run('COMMIT');
    res.status(201).json(s);
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbHelper.run('BEGIN TRANSACTION');

    const items = await dbHelper.all('SELECT * FROM sale_items WHERE saleId = ?', [id]);
    
    // Restore product stock
    for (const item of items) {
      await dbHelper.run(`
        UPDATE products
        SET quantitySold = MAX(0, quantitySold - ?), remainingStock = quantityPurchased - MAX(0, quantitySold - ?), updatedAt = ?
        WHERE id = ?
      `, [item.quantity, item.quantity, new Date().toISOString(), item.productId]);
    }

    await dbHelper.run('DELETE FROM sale_items WHERE saleId = ?', [id]);
    await dbHelper.run('DELETE FROM sales WHERE id = ?', [id]);

    await dbHelper.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// 5. Pre-Orders API (Multi-item)
app.get('/api/preorders', async (req, res) => {
  try {
    const preorders = await dbHelper.all('SELECT * FROM pre_orders ORDER BY date DESC');
    const items = await dbHelper.all('SELECT * FROM pre_order_items');
    
    const preordersWithItems = preorders.map(po => ({
      ...po,
      items: items.filter(item => item.preOrderId === po.id)
    }));
    res.json(preordersWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/preorders', async (req, res) => {
  const po = req.body;
  try {
    await dbHelper.run('BEGIN TRANSACTION');

    await dbHelper.run(`
      INSERT INTO pre_orders (id, date, customerId, customerName, customerPhone, customerAddress, category, totalRevenueDzd, totalDeliveryDzd, totalCostDzd, totalProfitDzd, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [po.id, po.date, po.customerId, po.customerName, po.customerPhone, po.customerAddress, po.category, po.totalRevenueDzd, po.totalDeliveryDzd, po.totalCostDzd, po.totalProfitDzd, po.status, po.notes]);

    for (const item of po.items) {
      const itemId = `poitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await dbHelper.run(`
        INSERT INTO pre_order_items (id, preOrderId, productId, productName, variant, size, quantity, originalCostEur, exchangeRate, deliveryCostDzd, priceDzd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [itemId, po.id, item.productId, item.productName, item.variant, item.size, item.quantity, item.originalCostEur, item.exchangeRate, item.deliveryCostDzd, item.priceDzd]);
    }

    await dbHelper.run('COMMIT');
    res.status(201).json(po);
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/preorders/:id', async (req, res) => {
  const { id } = req.params;
  const po = req.body;
  try {
    await dbHelper.run('BEGIN TRANSACTION');

    await dbHelper.run(`
      UPDATE pre_orders
      SET customerId = ?, customerName = ?, customerPhone = ?, customerAddress = ?, category = ?, totalRevenueDzd = ?, totalDeliveryDzd = ?, totalCostDzd = ?, totalProfitDzd = ?, status = ?, notes = ?
      WHERE id = ?
    `, [po.customerId, po.customerName, po.customerPhone, po.customerAddress, po.category, po.totalRevenueDzd, po.totalDeliveryDzd, po.totalCostDzd, po.totalProfitDzd, po.status, po.notes, id]);

    // Re-create items (delete old, insert new)
    await dbHelper.run('DELETE FROM pre_order_items WHERE preOrderId = ?', [id]);

    for (const item of po.items) {
      const itemId = `poitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await dbHelper.run(`
        INSERT INTO pre_order_items (id, preOrderId, productId, productName, variant, size, quantity, originalCostEur, exchangeRate, deliveryCostDzd, priceDzd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [itemId, id, item.productId, item.productName, item.variant, item.size, item.quantity, item.originalCostEur, item.exchangeRate, item.deliveryCostDzd, item.priceDzd]);
    }

    await dbHelper.run('COMMIT');
    res.json(po);
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/preorders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbHelper.run('BEGIN TRANSACTION');
    await dbHelper.run('DELETE FROM pre_order_items WHERE preOrderId = ?', [id]);
    await dbHelper.run('DELETE FROM pre_orders WHERE id = ?', [id]);
    await dbHelper.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// 5. Expenses API
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await dbHelper.all('SELECT * FROM expenses ORDER BY date DESC');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const e = req.body;
  try {
    await dbHelper.run(`
      INSERT INTO expenses (id, title, category, amountDzd, amountEur, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [e.id, e.title, e.category, e.amountDzd, e.amountEur, e.date, e.notes]);
    res.status(201).json(e);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbHelper.run('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbHelper.all('SELECT * FROM settings');
    const response = {};
    settings.forEach(s => {
      response[s.key] = JSON.parse(s.value);
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { key, value } = req.body;
  try {
    await dbHelper.run(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `, [key, JSON.stringify(value)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Bulk Maintenance API (Reset / Wipe / Import)
app.post('/api/maintenance/reset', async (req, res) => {
  try {
    // Drop child tables first
    await dbHelper.run('DROP TABLE IF EXISTS sale_items');
    await dbHelper.run('DROP TABLE IF EXISTS pre_order_items');
    // Drop parent tables
    await dbHelper.run('DROP TABLE IF EXISTS products');
    await dbHelper.run('DROP TABLE IF EXISTS customers');
    await dbHelper.run('DROP TABLE IF EXISTS sales');
    await dbHelper.run('DROP TABLE IF EXISTS pre_orders');
    await dbHelper.run('DROP TABLE IF EXISTS expenses');
    await dbHelper.run('DROP TABLE IF EXISTS settings');
    
    await dbHelper.initDb();
    await dbHelper.seedData(); // Seed only on explicit reset request
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance/clear', async (req, res) => {
  try {
    // Delete from child tables first
    await dbHelper.run('DELETE FROM sale_items');
    await dbHelper.run('DELETE FROM pre_order_items');
    // Delete from parent tables
    await dbHelper.run('DELETE FROM products');
    await dbHelper.run('DELETE FROM customers');
    await dbHelper.run('DELETE FROM sales');
    await dbHelper.run('DELETE FROM pre_orders');
    await dbHelper.run('DELETE FROM expenses');
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance/import', async (req, res) => {
  const data = req.body;
  try {
    await dbHelper.run('BEGIN TRANSACTION');

    // Clear all existing (child tables first)
    await dbHelper.run('DELETE FROM sale_items');
    await dbHelper.run('DELETE FROM pre_order_items');
    // Parent tables
    await dbHelper.run('DELETE FROM products');
    await dbHelper.run('DELETE FROM customers');
    await dbHelper.run('DELETE FROM sales');
    await dbHelper.run('DELETE FROM pre_orders');
    await dbHelper.run('DELETE FROM expenses');

    // Insert Products
    for (const p of data.products || []) {
      await dbHelper.run(`
        INSERT INTO products (id, sku, name, brand, description, category, variant, size, originalCostEur, exchangeRate, deliveryCostDzd, landedCostDzd, retailPriceDzd, quantityPurchased, quantitySold, remainingStock, prozisLink, weightAlloc, archived, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.id, p.sku, p.name, p.brand, p.description, p.category, p.variant, p.size, p.originalCostEur, p.exchangeRate, p.deliveryCostDzd, p.landedCostDzd, p.retailPriceDzd, p.quantityPurchased, p.quantitySold, p.remainingStock, p.prozisLink, p.weightAlloc, p.archived ? 1 : 0, p.createdAt, p.updatedAt]);
    }

    // Insert Customers
    for (const c of data.customers || []) {
      await dbHelper.run(`
        INSERT INTO customers (id, name, phone, address, instagram, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [c.id, c.name, c.phone, c.address, c.instagram, c.notes]);
    }

    // Insert Sales
    for (const s of data.sales || []) {
      await dbHelper.run(`
        INSERT INTO sales (id, date, totalRevenueDzd, totalBaseCostDzd, totalProfitDzd, totalProfitEur, customerId, customerName, customerPhone, customerAddress, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [s.id, s.date, s.totalRevenueDzd, s.totalBaseCostDzd, s.totalProfitDzd, s.totalProfitEur, s.customerId, s.customerName, s.customerPhone, s.customerAddress, s.notes]);

      for (const item of s.items || []) {
        const itemId = item.id || `sitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await dbHelper.run(`
          INSERT INTO sale_items (id, saleId, productId, productName, category, quantity, sellPriceDzd, baseCostDzd, profitDzd, exchangeRateUsed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [itemId, s.id, item.productId, item.productName, item.category, item.quantity, item.sellPriceDzd, item.baseCostDzd, item.profitDzd, item.exchangeRateUsed]);
      }
    }

    // Insert Pre-Orders
    for (const po of data.preOrders || []) {
      await dbHelper.run(`
        INSERT INTO pre_orders (id, date, customerId, customerName, customerPhone, customerAddress, category, totalRevenueDzd, totalDeliveryDzd, totalCostDzd, totalProfitDzd, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [po.id, po.date, po.customerId, po.customerName, po.customerPhone, po.customerAddress, po.category, po.totalRevenueDzd, po.totalDeliveryDzd, po.totalCostDzd, po.totalProfitDzd, po.status, po.notes]);

      for (const item of po.items || []) {
        const itemId = item.id || `poitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await dbHelper.run(`
          INSERT INTO pre_order_items (id, preOrderId, productId, productName, variant, size, quantity, originalCostEur, exchangeRate, deliveryCostDzd, priceDzd)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [itemId, po.id, item.productId, item.productName, item.variant, item.size, item.quantity, item.originalCostEur, item.exchangeRate, item.deliveryCostDzd, item.priceDzd]);
      }
    }

    // Insert Expenses
    for (const e of data.expenses || []) {
      await dbHelper.run(`
        INSERT INTO expenses (id, title, category, amountDzd, amountEur, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [e.id, e.title, e.category, e.amountDzd, e.amountEur, e.date, e.notes]);
    }

    // Insert Settings
    if (data.exchangeRates) {
      await dbHelper.run(`
        INSERT INTO settings (key, value) VALUES ('exchangeRates', ?)
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
      `, [JSON.stringify(data.exchangeRates)]);
    }
    if (data.capitalAllocation) {
      await dbHelper.run(`
        INSERT INTO settings (key, value) VALUES ('capitalAllocation', ?)
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
      `, [JSON.stringify(data.capitalAllocation)]);
    }

    await dbHelper.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await dbHelper.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback handler for Single Page Application routing (SPA)
  app.use((req, res, next) => {
    // If it is an unmatched API route, return JSON 404
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
    }
    // Only serve index.html for GET requests that accept html (SPA routing)
    if (req.method === 'GET' && req.accepts('html')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
  console.log(`Serving production frontend from: ${distPath}`);
} else {
  console.log('Production build folder /dist not found. Server running in API-only mode.');
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`POTY Portal backend listening on port ${PORT}`);
  });
}

module.exports = app;
