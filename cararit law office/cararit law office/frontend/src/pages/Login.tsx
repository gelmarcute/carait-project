const db = require('../models/db');
const bcrypt = require('bcryptjs');
const { addActivityLog } = require('./logsController');

exports.login = (req, res) => {
    const loginId = req.body.email || req.body.username;
    const password = req.body.password;

    console.log(`👉 Login attempt: ${loginId}`);

    if (!loginId || !password) {
        return res.status(400).json({
            error: "Please provide email and password"
        });
    }

    // ✅ FIXED: fullName instead of name
    const sql = `
        SELECT * 
        FROM users 
        WHERE fullName = ? OR email = ?
    `;

    db.query(sql, [loginId, loginId], async (err, results) => {

        if (err) {
            console.error("❌ DATABASE ERROR:", err);
            return res.status(500).json({
                error: "Database server error"
            });
        }

        // ✅ User not found
        if (results.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const user = results[0];

        let isMatch = false;

        try {

            // ✅ Kung hashed password
            if (
                user.password &&
                typeof user.password === 'string' &&
                user.password.startsWith('$2')
            ) {

                isMatch = await bcrypt.compare(
                    password,
                    user.password
                );

            } else {

                // ✅ Plain text support
                isMatch = password === user.password;
            }

        } catch (bcryptError) {

            console.error("❌ BCRYPT ERROR:", bcryptError);

            return res.status(500).json({
                error: "Password verification failed"
            });
        }

        // ✅ Wrong password
        if (!isMatch) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        console.log(`✅ LOGIN SUCCESS: ${user.fullName}`);

        try {
            addActivityLog(
                "User logged in",
                user.fullName
            );
        } catch (logError) {
            console.log("⚠️ Log failed:", logError.message);
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    });
};

exports.logout = (req, res) => {

    const { username } = req.body;

    try {

        addActivityLog(
            "User logged out",
            username || "Unknown User"
        );

    } catch (err) {

        console.log("⚠️ Logout log failed");
    }

    return res.json({
        success: true,
        message: "Logged out successfully"
    });
};