const db = require('../models/db');
const { addActivityLog } = require('./logsController'); 
const { sendEmail } = require('../utils/emailHelper');

exports.getTasks = (req, res) => {
    const sql = "SELECT * FROM tasks ORDER BY id DESC";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Error fetching tasks:", err.message);
            return res.status(500).json({ error: "Failed to fetch tasks", databaseError: err.message });
        }
        const tasks = result.map(task => ({
            ...task,
            completed: task.completed === 1,
            archived: task.archived === 1 
        }));
        res.json(tasks);
    });
};

exports.createTask = (req, res) => {
    const { title, description, assignedTo, createdBy } = req.body;

    if (!title) return res.status(400).json({ error: "Task title is required" });

    // 🌟 SUPER SAFE FALLBACKS:
    // Kung sakaling walang mapasa ang frontend, automatic itong magiging "System"
    // Hinding-hindi na ito papasok sa database bilang 'null'
    const safeDescription = description || null;
    const safeAssignedTo = assignedTo || null;
    const safeCreatedBy = createdBy ? createdBy : "System"; 

    const sql = "INSERT INTO tasks (title, description, assignedTo, createdBy) VALUES (?, ?, ?, ?)";
    const values = [title, safeDescription, safeAssignedTo, safeCreatedBy];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ TOTOONG ERROR NG DATABASE SA CREATE TASK:", err.message);
            return res.status(500).json({ 
                error: "Failed to create task",
                databaseErrorDetails: err.message, 
                sqlErrorCode: err.code 
            });
        }

        const actionText = `Created a new task: '${title}' assigned to ${safeAssignedTo || 'Unassigned'}`;
        addActivityLog(actionText, safeCreatedBy);

        // Email Notification logic
        if (safeAssignedTo) {
            db.query("SELECT email, fullName FROM users WHERE id = ? OR fullName = ?", [safeAssignedTo, safeAssignedTo], (userErr, userResults) => {
                if (!userErr && userResults.length > 0) {
                    const userEmail = userResults[0].email;
                    const subject = `New Task Assigned: ${title}`;
                    const body = `Hi ${userResults[0].fullName},\n\nA new task has been assigned to you by ${safeCreatedBy}.\n\nTask: ${title}\nDescription: ${safeDescription || 'No description provided'}\n\nPlease check the System for more details.\n\nThank you!`;
                    sendEmail(userEmail, subject, body);
                }
            });
        }

        res.status(201).json({ message: "Task created successfully", id: result.insertId });
    });
};

exports.updateTaskStatus = (req, res) => {
    const { id } = req.params;
    const { completed, user } = req.body; 

    db.query("SELECT title, assignedTo FROM tasks WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Task not found" });

        const taskTitle = results[0].title;
        const assignedTo = results[0].assignedTo || 'Unassigned';
        const isCompleted = completed ? 1 : 0;
        const actionUser = user || 'System';

        db.query("UPDATE tasks SET completed = ? WHERE id = ?", [isCompleted, id], (updateErr) => {
            if (updateErr) {
                console.error("❌ TOTOONG ERROR NG DATABASE SA UPDATE TASK:", updateErr.message);
                return res.status(500).json({ error: "Failed to update status", databaseErrorDetails: updateErr.message });
            }

            const actionText = completed 
                ? `Completed a task: ${taskTitle} assigned to ${assignedTo}` 
                : `Marked as pending: ${taskTitle} assigned to ${assignedTo}`;
            
            addActivityLog(actionText, actionUser);
            res.json({ message: "Task status updated successfully" });
        });
    });
};

exports.archiveTask = (req, res) => {
    const { id } = req.params;
    const { user, role } = req.body;

    if (role !== 'admin' && user !== 'Admin') {
        return res.status(403).json({ error: 'Access denied: Only admins can archive tasks.' });
    }

    db.query("SELECT title FROM tasks WHERE id = ?", [id], (err, results) => {
      if (err || results.length === 0) return res.status(404).json({ error: 'Task not found' });
      
      const taskTitle = results[0].title;
      db.query('UPDATE tasks SET archived = 1 WHERE id = ?', [id], (updateErr) => {
        if (updateErr) {
            console.error("❌ TOTOONG ERROR NG DATABASE SA ARCHIVE:", updateErr.message);
            return res.status(500).json({ error: 'Failed to archive task', databaseErrorDetails: updateErr.message });
        }
        
        addActivityLog(`Archived task: '${taskTitle}'`, user || 'System');
        res.json({ message: 'Task archived successfully' });
      });
    });
};

exports.deleteTask = (req, res) => {
    const { id } = req.params;
    const user = req.query.user || req.body.user; 
    const role = req.query.role || req.body.role;

    if (role !== 'admin' && user !== 'Admin') {
        return res.status(403).json({ error: 'Access denied: Only admins can delete tasks.' });
    }

    db.query("SELECT title FROM tasks WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Task not found" });

        const taskTitle = results[0].title;
        db.query("DELETE FROM tasks WHERE id = ?", [id], (deleteErr) => {
            if (deleteErr) {
                console.error("❌ TOTOONG ERROR NG DATABASE SA DELETE:", deleteErr.message);
                return res.status(500).json({ error: "Failed to delete task", databaseErrorDetails: deleteErr.message });
            }

            addActivityLog(`Deleted task: '${taskTitle}'`, user || 'System');
            res.json({ message: "Task deleted successfully" });
        });
    });
};