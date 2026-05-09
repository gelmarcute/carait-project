const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================
// LOGIN
// ============================

exports.login = async (req, res) => {

  console.log("🔥 LOGIN REQUEST");
  console.log(req.body);

  try {

    const loginId =
      req.body.email || req.body.username;

    const password =
      req.body.password;

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

    // ============================
    // DATABASE QUERY
    // ============================

    db.query(
      sql,
      [loginId, loginId, loginId],

      async (err, results) => {

        try {

          // ============================
          // DB ERROR
          // ============================

          if (err) {

            console.log("❌ DATABASE ERROR");
            console.log(err);

            return res.status(500).json({
              success: false,
              error: "Database error"
            });
          }

          // ============================
          // USER NOT FOUND
          // ============================

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

          // ============================
          // PASSWORD CHECK
          // ============================

          let match = false;

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

          // ============================
          // WRONG PASSWORD
          // ============================

          if (!match) {

            return res.status(401).json({
              success: false,
              error: "Wrong password"
            });
          }

          // ============================
          // JWT TOKEN
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

          // ============================
          // RESPONSE
          // ============================

          return res.status(200).json({
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

        } catch (innerError) {

          console.log("❌ INNER ERROR");
          console.log(innerError);

          return res.status(500).json({
            success: false,
            error: "Internal server error"
          });
        }
      }
    );

  } catch (error) {

    console.log("❌ LOGIN ERROR");
    console.log(error);

    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};