exports.login = (req, res) => {
    const { email, password } = req.body;

    console.log("👉 LOGIN ATTEMPT:", email);

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    // ✅ EMAIL LANG (match sa frontend)
    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("❌ DB ERROR:", err);
            return res.status(500).json({ error: "Server error" });
        }

        if (results.length === 0) {
            console.log("❌ USER NOT FOUND");
            return res.status(401).json({ error: "User not found" });
        }

        const user = results[0];

        try {
            // ✅ ALWAYS BCRYPT (tanggalin na ang plain text support)
            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                console.log("❌ WRONG PASSWORD");
                return res.status(401).json({ error: "Wrong password" });
            }

            console.log("🔥 LOGIN SUCCESS:", user.fullName);

            addActivityLog("User logged in", user.fullName);

            return res.json({
                user: {
                    id: user.id,
                    username: user.fullName,
                    role: user.role
                }
            });

        } catch (error) {
            console.error("❌ BCRYPT ERROR:", error);
            return res.status(500).json({ error: "Password verification failed" });
        }
    });
};