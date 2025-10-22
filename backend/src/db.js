const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1235678',
  database: process.env.DB_NAME || 'sales_monitoring',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Database connection pool created.');

module.exports = pool;
