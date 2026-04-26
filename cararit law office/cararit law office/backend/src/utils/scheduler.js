const cron = require('node-cron');
const db = require('../models/db'); // Siguraduhing may db.js ka sa models folder
const { sendEmail } = require('./emailHelper'); 

const startTaskScheduler = () => {
    console.log("⏳ Background Scheduler is active...");

    // Tumatakbo kada isang minuto
    cron.schedule('* * * * *', () => {
        // 🌟 GINAWANG PHILIPPINE TIME (Para iwas bug sa umaga)
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        // 1. TASKS REMINDER
        const taskSql = `
            SELECT t.id, t.title, u.email, u.fullName 
            FROM tasks t
            JOIN users u ON t.assignedTo = u.id OR t.assignedTo = u.fullName
            WHERE DATE(t.createdAt) = ? AND t.is_notified = 0
        `;
        db.query(taskSql, [today], (err, tasks) => {
            if (err) return console.error("❌ Task Notif Error:", err.message);
            tasks.forEach(task => {
                const subject = `Reminder: Task Assigned to You - ${task.title}`;
                const body = `Hi ${task.fullName},\n\nReminder lang na may task ka ngayong araw: "${task.title}".`;
                sendEmail(task.email, subject, body);
                db.query("UPDATE tasks SET is_notified = 1 WHERE id = ?", [task.id]);
            });
        });

        // 2. SCHEDULES REMINDER
        const scheduleSql = `
            SELECT s.id, s.title, u.email, u.fullName 
            FROM schedules s
            JOIN users u ON s.userId = u.id
            WHERE s.date = ? AND s.is_notified = 0
        `;
        db.query(scheduleSql, [today], (err, schedules) => {
            if (err) return console.error("❌ Schedule Notif Error:", err.message);
            schedules.forEach(schedule => {
                const subject = `Schedule Reminder: ${schedule.title}`;
                const body = `Hi ${schedule.fullName},\n\nMay schedule ka today: "${schedule.title}".`;
                sendEmail(schedule.email, subject, body);
                db.query("UPDATE schedules SET is_notified = 1 WHERE id = ?", [schedule.id]);
            });
        });
    });
};

module.exports = { startTaskScheduler };