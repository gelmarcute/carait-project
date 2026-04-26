const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Kinukuha ang listahan ng users para sa Task Dropdown
router.get('/', userController.getUsers); 
router.post('/', userController.createUser);
// 🌟 IDINAGDAG: Route para sa pag-edit ng buong User Details
router.put('/:id', userController.updateUser); 
router.put('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;