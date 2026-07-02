const { spawn } = require('child_process');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1. Start the backend server on port 5099 (to avoid conflicts)
const port = 5099;
const serverProcess = spawn('node', ['server/index.cjs'], {
  env: { ...process.env, PORT: port }
});

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log('Server:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString().trim());
});

// Wait for server to start
setTimeout(() => {
  console.log('Sending mock import request...');

  const mockProduct = {
    id: `prod-test-${Date.now()}`,
    sku: `TEST-SKU-${Math.floor(Math.random() * 10000)}`,
    name: 'Test Import Product',
    brand: 'TEST BRAND',
    description: 'Test description',
    category: 'Supplements',
    variant: 'Test Flavor',
    size: '1 kg',
    originalCostEur: 10.0,
    exchangeRate: 250,
    deliveryCostDzd: 500,
    landedCostDzd: 3000,
    retailPriceDzd: 4500,
    quantityPurchased: 10,
    quantitySold: 0,
    remainingStock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const data = JSON.stringify([mockProduct]);

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/products/bulk',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', body);

      // Verify in SQLite
      console.log('Verifying SQLite contents...');
      const dbPath = path.join(__dirname, '../database.sqlite');
      const db = new sqlite3.Database(dbPath);

      db.all('SELECT * FROM products WHERE name = ?', ['Test Import Product'], (err, rows) => {
        if (err) {
          console.error('DB query error:', err);
        } else {
          console.log('Found matching products in DB:', rows.length);
          console.log('Products details:', rows);
        }

        // Clean up
        db.close();
        serverProcess.kill();
        process.exit(0);
      });
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err);
    serverProcess.kill();
    process.exit(1);
  });

  req.write(data);
  req.end();
}, 2500);
