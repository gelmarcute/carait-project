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

// ============================
// TEST DATABASE CONNECTION
// ============================

db.getConnection((err, connection) => {

    if (err) {

        console.error('❌ DATABASE CONNECTION ERROR');
        console.error(err.message);

        switch (err.code) {

            case 'PROTOCOL_CONNECTION_LOST':
                console.error('Database connection closed.');
                break;

            case 'ER_CON_COUNT_ERROR':
                console.error('Too many database connections.');
                break;

            case 'ECONNREFUSED':
                console.error('Database connection refused.');
                break;

            case 'ER_ACCESS_DENIED_ERROR':
                console.error('Wrong MySQL username/password.');
                break;

            case 'ENOTFOUND':
                console.error('Database host not found.');
                break;

            default:
                console.error('Unknown database error.');
        }

        return;
    }

    console.log('✅ MYSQL DATABASE CONNECTED');

    connection.release();
});

module.exports = db;