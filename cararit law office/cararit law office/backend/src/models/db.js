require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ DB Model Connection Error:', err.message);
  } else {
    console.log('✅ DB Model Connected to MySQL');
    connection.release();
  }
});

module.exports = db;