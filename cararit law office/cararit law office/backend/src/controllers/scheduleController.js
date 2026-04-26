const db = require('../models/db');
const { addActivityLog } = require('./logsController'); 
const { sendEmail } = require('../utils/emailHelper'); 

// Helper function para sa ligtas na Date formatting
const formatDateSafely = (dateValue) => {
    if (!dateValue) return null;
    try {
        const d = new Date(dateValue);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateValue; 
    }
};

// 1. GET SCHEDULES
exports.getSchedules = (req, res) => {
    const { userId, role } = req.query;
    let sql = "SELECT * FROM schedules";
    let params = [];

    // ✅ FIX: Ginawa nating exempted ang 'scheduler' para makita nila ang lahat ng calendar events!
    // Kung gusto mong lahat pati inventory_staff ay makakita, tanggalin mo na lang buong if statement na ito.
    if (role && role !== 'admin' && role !== 'scheduler') {
        sql += " WHERE userId = ?";
        params.push(userId);
    }
    
    sql += " ORDER BY date DESC, startTime ASC";

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch schedules" });
        const cleaned = result.map(row => ({
            ...row,
            date: formatDateSafely(row.date)
        }));
        res.json(cleaned);
    });
};

// 2. CREATE SCHEDULE
exports.createSchedule = (req, res) => {
    let { title, eventType, date, startTime, endTime, location, status, createdBy, userId } = req.body; 
    const cleanDate = formatDateSafely(date);
    const sql = `INSERT INTO schedules (title, eventType, date, startTime, endTime, location, status, createdBy, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [title, eventType, cleanDate, startTime, endTime, location, status, createdBy, userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to insert schedule" });
        
        addActivityLog(`Created a new schedule: ${title}`, createdBy || 'System');

        if (userId) {
            db.query("SELECT email, fullName FROM users WHERE id = ?", [userId], (userErr, userResults) => {
                if (!userErr && userResults.length > 0) {
                    const userEmail = userResults[0].email;
                    const userFullName = userResults[0].fullName;
                    const subject = `New Schedule: ${title}`;
                    const body = `Hi ${userFullName},\n\nA new schedule has been assigned to you:\n\n${title}\nLocation: ${location}\nDate: ${cleanDate}\nTime: ${startTime} - ${endTime}\n\nPlease check the system.`;
                    sendEmail(userEmail, subject, body);
                }
            });
        }
        res.json({ message: "Schedule created successfully", id: result.insertId });
    });
};

// 3. UPDATE SCHEDULE
exports.updateSchedule = (req, res) => {
    let { title, eventType, date, startTime, endTime, location, status, requesterId, userName } = req.body;
    const scheduleId = req.params.id;
    const cleanDate = formatDateSafely(date);

    const sql = `UPDATE schedules SET title=?, eventType=?, date=?, startTime=?, endTime=?, location=?, status=? WHERE id=?`;

    db.query(sql, [title, eventType, cleanDate, startTime, endTime, location, status, scheduleId], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: "Failed to update schedule" });
        addActivityLog(`Updated schedule: ${title}`, userName || `User ID ${requesterId || 'Unknown'}`);
        res.json({ message: "Schedule updated successfully" });
    });
};

// 4. UPDATE SCHEDULE STATUS
exports.updateScheduleStatus = (req, res) => {
    const scheduleId = req.params.id;
    const { status, userName } = req.body;

    db.query("UPDATE schedules SET status=? WHERE id=?", [status, scheduleId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update schedule status" });
        addActivityLog(`Updated schedule status to ${status}`, userName || `Admin`);
        res.json({ message: "Schedule status updated successfully" });
    });
};

// 5. DELETE SCHEDULE
exports.deleteSchedule = (req, res) => {
    const scheduleId = req.params.id;
    const userName = req.query.userName || req.body.userName; 

    db.query("DELETE FROM schedules WHERE id=?", [scheduleId], (deleteErr) => {
        if (deleteErr) return res.status(500).json({ error: "Failed to delete schedule" });
        addActivityLog(`Deleted a schedule`, userName || `Admin`);
        res.json({ message: "Schedule deleted successfully" });
    });
};