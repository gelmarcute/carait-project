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

// I-test ang connection kapag tinawag itong file
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Models/DB MySQL Connection Error:', err.message);
  } else {
    console.log('✅ Models/DB Successfully Connected to MySQL Database');
    connection.release();
  }
});

module.exports = db;