const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');

router.get('/', tasksController.getTasks);
router.post('/', tasksController.createTask || tasksController.addTask);
router.put('/:id/status', tasksController.updateTaskStatus || tasksController.updateTask);
router.put('/:id/archive', tasksController.archiveTask);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;