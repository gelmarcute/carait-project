const express = require('express');
const router = express.Router();
// Siguraduhing tama ang path papunta sa controller mo
const authController = require('../controllers/authController'); 

// 🌟 DAPAT '/login' LANG ITO, HINDI '/api/auth/login'
router.post('/login', authController.login); 

router.post('/logout', authController.logout);

module.exports = router;