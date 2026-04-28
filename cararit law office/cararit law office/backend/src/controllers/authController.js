const db = require('../models/db'); 
const bcrypt = require('bcryptjs');
const { addActivityLog } = require('./logsController'); 

exports.login = (req, res) => {
    const loginId = req.body.email || req.body.username;
    const password = req.body.password;

    console.log(`👉 MAY NAGTA-TRY MAG-LOGIN: ${loginId}`); 

    if (!loginId || !password) {
        return res.status(400).json({ error: "Please provide email and password" });
    }

    const sql = "SELECT * FROM users WHERE name = ? OR email = ?";

    db.query(sql, [loginId, loginId], async (err, results) => {
        if (err) {
            console.error("❌ DB ERROR SA LOGIN:", err);
            return res.status(500).json({ error: "Server error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials: User not found" });
        }

        const user = results[0];
        let match = false;

        try {
            if (user.password && user.password.startsWith('$2')) {
                match = await bcrypt.compare(password, user.password);
            } else {
                match = (password === user.password); // Tatanggapin nito ang "gelmar123"
            }
        } catch (bcryptError) {
            console.error("❌ HASHING ERROR:", bcryptError.message);
            return res.status(500).json({ error: "System error while verifying password" });
        }

        if (!match) {
            return res.status(401).json({ error: "Invalid credentials: Wrong password" });
        }

        console.log(`🔥 LOGIN SUCCESS: ${user.name}`);
        addActivityLog("User logged in", user.name);

        return res.json({
            message: "Welcome! You are now logged in.",
            user: {
                id: user.id,
                username: user.name,
                role: user.role
            }
        });
    });
};

exports.logout = (req, res) => {
    const { username } = req.body;
    addActivityLog("User logged out", username || 'Unknown User');
    res.json({ message: "Logged out successfully" });
};