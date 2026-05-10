const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ============================
// LOGIN ROUTE
// ============================
router.post('/login', authController.login);

// ============================
// LOGOUT ROUTE
// ============================
router.post('/logout', authController.logout);

module.exports = router;