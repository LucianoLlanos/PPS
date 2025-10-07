const http = require('http');

http.get('http://127.0.0.1:3000/debug/admin-status', (res) => {
  console.log('statusCode', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('body:', data));
}).on('error', (e) => console.error('error', e.message));
