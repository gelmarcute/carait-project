const db = require('../models/db');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const {
    addActivityLog
} = require('./logsController');

// ============================
// LOGIN
// ============================

exports.login = (req, res) => {

    console.log("🔥 LOGIN REQUEST:");
    console.log(req.body);

    // ============================
    // GET INPUTS
    // ============================

    const loginId =
        req.body.email ||
        req.body.username;

    const password =
        req.body.password;

    // ============================
    // VALIDATE INPUTS
    // ============================

    if (!loginId || !password) {

        return res.status(400).json({
            success: false,
            error:
                "Please provide email/username and password"
        });
    }

    // ============================
    // SQL QUERY
    // ============================

    const sql = `
        SELECT * FROM users
        WHERE
            email = ?
            OR name = ?
            OR fullName = ?
        LIMIT 1
    `;

    // ============================
    // DATABASE QUERY
    // ============================

    db.query(
        sql,
        [loginId, loginId, loginId],
        async (err, results) => {

            // ============================
            // DATABASE ERROR
            // ============================

            if (err) {

                console.error(
                    "❌ DATABASE ERROR:"
                );

                console.error(err);

                return res.status(500).json({
                    success: false,
                    error:
                        "Database server error"
                });
            }

            console.log(
                "✅ DATABASE RESULTS:"
            );

            console.log(results);

            // ============================
            // USER NOT FOUND
            // ============================

            if (
                !results ||
                results.length === 0
            ) {

                return res.status(401).json({
                    success: false,
                    error:
                        "User not found"
                });
            }

            // ============================
            // USER FOUND
            // ============================

            const user = results[0];

            console.log(
                "✅ USER FOUND:"
            );

            console.log(user);

            let match = false;

            // ============================
            // CHECK PASSWORD
            // ============================

            try {

                // HASHED PASSWORD

                if (
                    user.password &&
                    user.password.startsWith('$2')
                ) {

                    match =
                        await bcrypt.compare(
                            password,
                            user.password
                        );

                } else {

                    // PLAIN TEXT PASSWORD

                    match =
                        password ===
                        user.password;
                }

            } catch (bcryptError) {

                console.error(
                    "❌ PASSWORD ERROR:"
                );

                console.error(
                    bcryptError
                );

                return res.status(500).json({
                    success: false,
                    error:
                        "Password verification failed"
                });
            }

            console.log(
                "PASSWORD MATCH:",
                match
            );

            // ============================
            // WRONG PASSWORD
            // ============================

            if (!match) {

                return res.status(401).json({
                    success: false,
                    error:
                        "Wrong password"
                });
            }

            // ============================
            // CREATE JWT TOKEN
            // ============================

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },

                process.env.JWT_SECRET ||
                "secret_key",

                {
                    expiresIn: '7d'
                }
            );

            // ============================
            // ACTIVITY LOG
            // ============================

            try {

                addActivityLog(
                    "User logged in",
                    user.name ||
                    user.fullName ||
                    "Unknown User"
                );

            } catch (logError) {

                console.error(
                    "❌ LOG ERROR:"
                );

                console.error(
                    logError
                );
            }

            // ============================
            // SUCCESS RESPONSE
            // ============================

            console.log(
                `🔥 LOGIN SUCCESS: ${user.name}`
            );

            return res.json({

                success: true,

                message:
                    "Welcome! You are now logged in.",

                token,

                user: {

                    id: user.id,

                    username:
                        user.name,

                    fullName:
                        user.fullName,

                    email:
                        user.email,

                    role:
                        user.role
                }
            });
        }
    );
};

// ============================
// LOGOUT
// ============================

exports.logout = (req, res) => {

    const { username } = req.body;

    try {

        addActivityLog(
            "User logged out",
            username || 'Unknown User'
        );

    } catch (err) {

        console.error(
            "❌ LOGOUT LOG ERROR:"
        );

        console.error(err);
    }

    return res.json({

        success: true,

        message:
            "Logged out successfully"
    });
};