const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================
// LOGIN
// ============================

exports.login = async (req, res) => {

  console.log(
    "🔥 LOGIN REQUEST:",
    req.body.email || req.body.username
  );

  try {

    const loginId =
      req.body.email ||
      req.body.username;

    const password =
      req.body.password;

    if (!loginId || !password) {

      return res.status(400).json({

        success: false,

        error:
          "Please provide credentials"
      });
    }

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

        try {

          if (err) {

            console.log(
              "❌ DATABASE ERROR:",
              err
            );

            return res.status(500).json({

              success: false,

              error:
                "Database error"
            });
          }

          if (
            !results ||
            results.length === 0
          ) {

            console.log(
              "❌ USER NOT FOUND"
            );

            return res.status(401).json({

              success: false,

              error:
                "User not found"
            });
          }

          const user = results[0];

          let match = false;

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

            match =
              password === user.password;
          }

          if (!match) {

            console.log(
              "❌ WRONG PASSWORD"
            );

            return res.status(401).json({

              success: false,

              error:
                "Wrong password"
            });
          }

          if (!process.env.JWT_SECRET) {

            console.log(
              "❌ MISSING JWT_SECRET"
            );

            return res.status(500).json({

              success: false,

              error:
                "Server configuration error"
            });
          }

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

          console.log(
            "✅ LOGIN SUCCESS"
          );

          return res.status(200).json({

            success: true,

            message:
              "Login successful",

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

          console.log(
            "❌ INNER ERROR:",
            innerError
          );

          return res.status(500).json({

            success: false,

            error:
              "Internal server error"
          });
        }
      }
    );

  } catch (error) {

    console.log(
      "❌ LOGIN ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        "Server error"
    });
  }
};

// ============================
// LOGOUT
// ============================

exports.logout = async (req, res) => {

  return res.status(200).json({

    success: true,

    message:
      "Logout successful"
  });
};