const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,       // Siguraduhing MYSQLHOST ito, hindi DB_HOST
  user: process.env.MYSQLUSER,       // MYSQLUSER
  password: process.env.MYSQLPASSWORD, // MYSQLPASSWORD
  database: process.env.MYSQLDATABASE, // MYSQLDATABASE
  port: process.env.MYSQLPORT || 3306
});

module.exports = pool;