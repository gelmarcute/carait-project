const db = require('../models/db');

function addActivityLog(action, user = 'System') {
    const sql = "INSERT INTO logs (action, user) VALUES (?, ?)";

    db.query(sql, [action, user], (err) => {
        if (err) {
            console.error('❌ Activity log failed:', err.message);
        } else {
            console.log('✅ Activity log saved');
        }
    });
}

module.exports = addActivityLog;

