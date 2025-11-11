const https = require('http');

// Test del endpoint HTTP real
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/pedidos',
  method: 'GET'
};

console.log('Probando endpoint GET /pedidos desde HTTP...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const pedidos = JSON.parse(data);
      console.log('=== RESPUESTA DEL API ===');
      console.log(`Status: ${res.statusCode}`);
      console.log(`Total de pedidos: ${pedidos.length}`);
      
      // Buscar pedidos 75 y 76 específicamente
      const pedido75 = pedidos.find(p => p.idPedido === 75);
      const pedido76 = pedidos.find(p => p.idPedido === 76);
      
      if (pedido75) {
        console.log(`\n✅ Pedido 75 encontrado:`);
        console.log(`   Total: ${pedido75.total} (${typeof pedido75.total})`);
        console.log(`   Productos: ${pedido75.productos?.length || 0}`);
      } else {
        console.log('\n❌ Pedido 75 NO encontrado');
      }
      
      if (pedido76) {
        console.log(`\n✅ Pedido 76 encontrado:`);
        console.log(`   Total: ${pedido76.total} (${typeof pedido76.total})`);
        console.log(`   Productos: ${pedido76.productos?.length || 0}`);
      } else {
        console.log('\n❌ Pedido 76 NO encontrado');
      }
      
      console.log('\n=== TODOS LOS PEDIDOS ===');
      pedidos.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.idPedido} | Total: ${p.total} | Usuario: ${p.nombreUsuario}`);
      });
      
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error en request:', error.message);
});

req.end();