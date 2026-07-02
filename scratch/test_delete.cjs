const { spawn } = require('child_process');
const http = require('http');

const port = 5098;
const serverProcess = spawn('node', ['server/index.cjs'], {
  env: { ...process.env, PORT: port }
});

serverProcess.stdout.on('data', (data) => {
  console.log('Server:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString().trim());
});

setTimeout(() => {
  console.log('Sending delete request...');

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/products/prod-test-1782943922582',
    method: 'DELETE'
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', body);

      // Clean up
      serverProcess.kill();
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err);
    serverProcess.kill();
    process.exit(1);
  });

  req.end();
}, 2000);
