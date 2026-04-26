const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');


router.get('/', inventoryController.getInventory);
router.get('/transactions', inventoryController.getTransactions);
router.post('/', inventoryController.addInventory);
router.put('/:id', inventoryController.updateInventory);
router.post('/:id/release', inventoryController.releaseInventory);
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;