const db = require('../models/db');

exports.getLogs = (req, res) => {
    const sql = "SELECT id, action, user, timestamp FROM logs ORDER BY timestamp DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Fetch logs error:', err.message);
            return res.status(500).json({ error: "Failed to fetch logs" });
        }
        res.json(results);
    });
};

exports.createLog = (req, res) => {
    const { action, user } = req.body;

    if (!action) {
        return res.status(400).json({ error: "Action is required" });
    }

    exports.addActivityLog(action, user);
    res.status(201).json({ message: "Log saved successfully" });
};

exports.addActivityLog = (action, user = 'System') => {
    if (!action) return;

    const sql = "INSERT INTO logs (action, user) VALUES (?, ?)";

    db.query(sql, [action, user], (err) => {
        if (err) {
            console.error('❌ LOG ERROR:', err.message);
        } else {
            console.log(`✅ LOG SAVED: ${action} | By: ${user}`);
        }
    });
};