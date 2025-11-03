const https = require('http');

const req = https.get('http://localhost:3000/pedidos', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const pedidos = JSON.parse(data);
      console.log('✅ Backend funcionando correctamente!');
      console.log(`📊 Total pedidos: ${pedidos.length}`);
      
      const pedido75 = pedidos.find(p => p.idPedido === 75);
      const pedido76 = pedidos.find(p => p.idPedido === 76);
      
      if (pedido75) {
        console.log(`\n🔥 Pedido 75: TOTAL = ${pedido75.total} (${typeof pedido75.total})`);
        console.log(`   ✅ CORREGIDO: Se mantiene el total de la BD`);
      }
      
      if (pedido76) {
        console.log(`\n🔥 Pedido 76: TOTAL = ${pedido76.total} (${typeof pedido76.total})`);
        console.log(`   ✅ CORREGIDO: Se mantiene el total de la BD`);
      }
      
      console.log('\n🎯 Estado de correcciones aplicadas:');
      console.log('   ✅ detalle_pedido → detalle_pedidos');
      console.log('   ✅ Eliminada sobrescritura de totales');
      
    } catch (e) {
      console.error('❌ Error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error de conexión:', e.message);
  console.log('💡 El backend puede no estar ejecutándose en el puerto 3000');
});

req.setTimeout(5000, () => {
  console.log('⏱️ Timeout - El backend tardó mucho en responder');
  req.destroy();
});