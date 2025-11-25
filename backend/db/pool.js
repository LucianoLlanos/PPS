const mysql = require('mysql2/promise');

// Pool de conexiones basado en mysql2/promise para uso con async/await
// Mantiene compatibilidad con variables de entorno actuales
const pool = mysql.createPool({
	host: process.env.MYSQL_HOST || '127.0.0.1',
	user: process.env.MYSQL_USER || 'root',
	password: process.env.MYSQL_PASSWORD || 'Nickrex692.-',
	database: process.env.MYSQL_DB || 'atilio_marola',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	// timezone opcional si se requiere:
	// timezone: 'Z',
});

module.exports = { pool };
