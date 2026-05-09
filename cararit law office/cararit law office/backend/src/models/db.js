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

  dateStrings: true,

  connectTimeout: 10000,

  enableKeepAlive: true,

  keepAliveInitialDelay: 0
});

db.getConnection((err, connection) => {

  if (err) {

    console.error(
      '❌ DB CONNECTION ERROR'
    );

    console.error(err);

  } else {

    console.log(
      '✅ MYSQL CONNECTED'
    );

    connection.release();
  }
});

db.on('error', (err) => {

  console.log(
    '❌ MYSQL POOL ERROR'
  );

  console.log(err);
});

module.exports = db;