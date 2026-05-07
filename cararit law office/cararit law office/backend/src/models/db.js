const mysql = require('mysql2');

const db = mysql.createPool({
    // 🌟 BINAGO: Babasahin na nito ang Railway Variables, 
    // pero kung nasa laptop ka, 'localhost' at 'root' pa rin ang gagamitin.
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'brgy_system',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    
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