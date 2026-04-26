const db = require('../models/db');
const bcrypt = require('bcryptjs');
const { addActivityLog } = require('./logsController'); 
const { sendEmail } = require('../utils/emailHelper'); 

exports.getUsers = (req, res) => {
    const sql = "SELECT id, name, email, fullName, role, created_at FROM users ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch users" });
        res.json(results);
    });
};

exports.createUser = async (req, res) => {
    try {
        const { email, fullName, password, role, adminUser } = req.body; 

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: "All required fields missing!" });
        }

        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (err) return res.status(500).json({ error: "Database error checking email" });
            if (results.length > 0) return res.status(409).json({ error: "Email already exists!" });

            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const sql = `INSERT INTO users (name, email, fullName, password, role) VALUES (?, ?, ?, ?, ?)`;
                const values = [fullName, email, fullName, hashedPassword, role || 'scheduler'];

                db.query(sql, values, (insertErr, result) => {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });

                    addActivityLog(`Created a new user account: ${fullName}`, adminUser || 'Admin');
                    
                    try {
                        const emailSubject = "Welcome to Our System!";
                        const emailBody = `Hi ${fullName},\n\nYour account has been created.\n\nEmail: ${email}\nRole: ${role || 'scheduler'}\n\nPlease login using your provided password.`;
                        sendEmail(email, emailSubject, emailBody);
                    } catch(e) { console.log("Email failed to send, but user created."); }

                    res.status(201).json({ message: "User created!", userId: result.insertId });
                });
            } catch (hashError) {
                return res.status(500).json({ error: "Error hashing password" });
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { fullName, email, password, role, adminUser } = req.body;

    try {
        let sql, values;
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql = "UPDATE users SET fullName = ?, name = ?, email = ?, role = ?, password = ? WHERE id = ?";
            values = [fullName, fullName, email, role, hashedPassword, id];
        } else {
            sql = "UPDATE users SET fullName = ?, name = ?, email = ?, role = ? WHERE id = ?";
            values = [fullName, fullName, email, role, id];
        }

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ error: "Failed to update user" });
            addActivityLog(`Updated account details for user: ${fullName}`, adminUser || 'Admin');
            res.json({ message: "User updated successfully!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error updating user" });
    }
};

exports.updateUserRole = (req, res) => {
    const { id } = req.params;
    const { role, name, adminUser } = req.body; 

    db.query("UPDATE users SET role = ? WHERE id = ?", [role, id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update role" });
        addActivityLog(`Updated role to '${role}' for user: ${name || 'ID ' + id}`, adminUser || 'Admin');
        res.json({ message: "Role updated!" });
    });
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;
    const adminUser = req.body.adminUser || req.query.adminUser || 'Admin'; 

    db.query("SELECT fullName FROM users WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "User not found" });

        const deletedUserName = results[0].fullName || `User ID ${id}`;
        db.query("DELETE FROM users WHERE id = ?", [id], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: "Failed to delete user" });
            addActivityLog(`Deleted user account: '${deletedUserName}'`, adminUser);
            res.json({ message: "User deleted successfully" });
        });
    });
};