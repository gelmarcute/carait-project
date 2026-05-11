const express = require('express');

const router = express.Router();

const {
  login,
  logout
} = require('../controllers/authController');

// ============================
// LOGIN
// ============================

router.post('/login', login);

// ============================
// LOGOUT
// ============================

router.post('/logout', logout);

// ============================
// EXPORT
// ============================

module.exports = router;