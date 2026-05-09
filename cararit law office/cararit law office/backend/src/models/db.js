const mysql = require('mysql2');

const db = mysql.createPool({

    host:
        process.env.MYSQLHOST ||
        process.env.DB_HOST ||
        'localhost',

    user:
        process.env.MYSQLUSER ||
        process.env.DB_USER ||
        'root',

    password:
        process.env.MYSQLPASSWORD ||
        process.env.DB_PASSWORD ||
        '',

    database:
        process.env.MYSQLDATABASE ||
        process.env.DB_NAME ||
        'brgy_system',

    port:
        process.env.MYSQLPORT ||
        process.env.DB_PORT ||
        3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

db.getConnection((err, connection) => {

    if (err) {

        console.error('❌ DATABASE CONNECTION ERROR');
        console.error(err);

        return;
    }

    console.log('✅ MYSQL CONNECTED');

    connection.release();
});

module.exports = db;