const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/productos',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const json = JSON.parse(data || 'null');
      console.log('body (json):', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('body (text):', data);
    }
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
