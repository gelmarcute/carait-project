const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',      // O kung ano ang host mo
    user: 'root',           // Default user sa XAMPP
    password: '',           // Ilagay ang password kung meron
    database: 'brgy_system', // PALITAN ITO NG TOTOONG PANGALAN NG DATABASE MO
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// I-test ang connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ DATABASE CONNECTION ERROR:', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused. Naka-on ba ang XAMPP/MySQL mo?');
        }
    } else {
        console.log('✅ Successfully connected to the database.');
        connection.release();
    }
});

module.exports = db;