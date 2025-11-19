const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: 'localhost', port: 3000, path }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error('Timeout'));
    });
  });
}

(async () => {
  try {
    console.log('== Smoke test backend ==');

    const health = await get('/health');
    console.log('GET /health ->', health.status, health.body);

    const productos = await get('/productos');
    console.log('GET /productos ->', productos.status);
    try {
      const parsed = JSON.parse(productos.body);
      console.log('Productos recibidos:', Array.isArray(parsed) ? parsed.length : typeof parsed);
    } catch (e) {
      console.log('Respuesta productos (raw):', productos.body?.slice(0, 200));
    }

    console.log('\nListo.');
  } catch (err) {
    console.error('Smoke test falló:', err.message);
    console.log('¿Está ejecutándose el backend en http://localhost:3000?');
  }
})();
