const express = require('express');
const router = express.Router();
const logController = require('../controllers/logsController');

router.get('/', logController.getLogs);
router.post('/', logController.createLog);


module.exports = router;