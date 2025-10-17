const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000,
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('body:', data);
  });
});

req.on('error', (e) => {
  console.error('request error', e.message);
});

req.on('timeout', () => {
  console.error('request timeout');
  req.destroy();
});

req.end();
