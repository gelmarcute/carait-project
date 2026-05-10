const mysql = require('mysql2'); // o 'mysql', depende sa naka-install sa'yo
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    
    // 🔥 PAMPIGIL SA TIMEOUT AT HANGING REQUESTS
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 // Mag-e-error agad imbes na mag-hang forever
});

module.exports = db;