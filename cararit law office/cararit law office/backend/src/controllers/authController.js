const db = require('../models/db');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

// ============================
// LOGIN
// ============================

exports.login = (req, res) => {

  console.log("🔥 LOGIN REQUEST");
  console.log(req.body);

  const loginId =
    req.body.email || req.body.username;

  const password = req.body.password;

  // ============================
  // VALIDATION
  // ============================

  if (!loginId || !password) {

    return res.status(400).json({
      success: false,
      error: "Please provide credentials"
    });
  }

  // ============================
  // QUERY
  // ============================

  const sql = `
    SELECT * FROM users
    WHERE email = ?
    OR name = ?
    OR fullName = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [loginId, loginId, loginId],

    async (err, results) => {

      if (err) {

        console.log("❌ DATABASE ERROR");

        console.log(err);

        return res.status(500).json({
          success: false,
          error: "Database error"
        });
      }

      if (
        !results ||
        results.length === 0
      ) {

        return res.status(401).json({
          success: false,
          error: "User not found"
        });
      }

      const user = results[0];

      let match = false;

      try {

        if (
          user.password &&
          user.password.startsWith('$2')
        ) {

          match = await bcrypt.compare(
            password,
            user.password
          );

        } else {

          match =
            password === user.password;
        }

      } catch (error) {

        console.log(error);

        return res.status(500).json({
          success: false,
          error: "Password verification failed"
        });
      }

      if (!match) {

        return res.status(401).json({
          success: false,
          error: "Wrong password"
        });
      }

      // ============================
      // TOKEN
      // ============================

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role
        },

        process.env.JWT_SECRET,

        {
          expiresIn: '7d'
        }
      );

      console.log("✅ LOGIN SUCCESS");

      return res.json({
        success: true,
        message: "Login successful",

        token,

        user: {
          id: user.id,
          username: user.name,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
    }
  );
};

// ============================
// LOGOUT
// ============================

exports.logout = (req, res) => {

  return res.json({
    success: true,
    message: "Logged out successfully"
  });
};