const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/', scheduleController.getSchedules);
router.post('/', scheduleController.createSchedule || scheduleController.addSchedule);

// 🌟 INAYOS: Hiwalay na route para sa pag-edit ng details at pag-edit ng status
router.put('/:id', scheduleController.updateSchedule); 
router.put('/:id/status', scheduleController.updateScheduleStatus); 

router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;