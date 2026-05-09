const mysql = require('mysql2');

const db = mysql.createPool({

  host: process.env.MYSQLHOST,

  user: process.env.MYSQLUSER,

  password: process.env.MYSQLPASSWORD,

  database: process.env.MYSQLDATABASE,

  port: process.env.MYSQLPORT,

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0
});

db.getConnection((err, connection) => {

  if (err) {

    console.log("❌ DATABASE CONNECTION ERROR");

    console.log(err);

    return;
  }

  console.log("✅ MYSQL CONNECTED");

  connection.release();
});

module.exports = db;