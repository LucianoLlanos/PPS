const { connection } = require('../db/DB');

const q = (sql, params=[]) => new Promise((res, rej) => connection.query(sql, params, (err, rows) => err ? rej(err) : res(rows)));

async function run() {
  try {
    const usuarios = await q('SELECT COUNT(*) AS total FROM usuarios');
    const roles = await q('SELECT COUNT(*) AS total FROM roles');
    const sucursales = await q('SELECT COUNT(*) AS total FROM sucursales');
    const stock = await q('SELECT COUNT(*) AS total FROM stock_sucursal');
    const productos = await q('SELECT COUNT(*) AS total FROM productos');

    console.log('conteos:');
    console.log({ usuarios: usuarios[0].total, roles: roles[0].total, sucursales: sucursales[0].total, stock: stock[0].total, productos: productos[0].total });

    const u = await q('SELECT idUsuario, nombre, apellido, email, idRol FROM usuarios LIMIT 5');
    const r = await q('SELECT idRol, nombreRol FROM roles LIMIT 10');
  // la columna real en la tabla es 'nombre'
  const s = await q('SELECT idSucursal, nombre FROM sucursales LIMIT 10');
    const st = await q('SELECT idSucursal, idProducto, stockDisponible FROM stock_sucursal LIMIT 10');
    const p = await q('SELECT idProducto, nombre, precio, stockTotal FROM productos LIMIT 10');

    console.log('\nusuarios sample:', JSON.stringify(u, null, 2));
    console.log('\nroles sample:', JSON.stringify(r, null, 2));
    console.log('\nsucursales sample:', JSON.stringify(s, null, 2));
    console.log('\nstock_sucursal sample:', JSON.stringify(st, null, 2));
    console.log('\nproductos sample:', JSON.stringify(p, null, 2));
  } catch (err) {
    console.error('Error checking admin tables:', err.message || err);
  } finally {
    connection.end(() => process.exit(0));
  }
}

run();
