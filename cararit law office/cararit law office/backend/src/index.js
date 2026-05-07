require('dotenv').config({ path: '../.env' });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// 🌟 IMPORT ANG HELPER FUNCTION PARA SA LOGS
const { addActivityLog } = require('./controllers/logsController'); 

// 🌟 IMPORT ANG EMAIL HELPER AT BACKGROUND SCHEDULER
const { sendEmail } = require('./utils/emailHelper'); 
const { startTaskScheduler } = require('./utils/scheduler'); 

const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// MIDDLEWARES (INAYOS ANG CORS)
// ============================
app.use(helmet({ crossOriginResourcePolicy: false }));

// Pinapayagan nito ang Frontend mo na kumonekta sa Backend mo
app.use(cors({
    origin: [
        'http://localhost:8080', 
        'http://127.0.0.1:8080',
        'http://localhost:8081',    // ✅ IDINAGDAG PARA SA IYONG REACT APP
        'http://127.0.0.1:8081',    // ✅ IDINAGDAG PARA SA IYONG REACT APP
        'http://localhost:5173',    // ✅ IDINAGDAG PARA SA DEFAULT VITE PORT (Just in case)
        'https://carait-project-production.up.railway.app', 
        'https://carait-project-gelmarcutes-projects.vercel.app' 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// ============================
// DATABASE CONNECTION - READY PARA SA LOCAL AT INTERNET
// ============================
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brgy_system',
  port: process.env.DB_PORT || 3306,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
      console.error('❌ MySQL Connection Error:', err.message);
  } else {
      console.log('✅ Connected to MySQL database via Connection Pool!');
      connection.release(); 
  }
});

// ============================
// UPLOADS CONFIGURATION (MULTER)
// ============================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// ============================
// ROUTES IMPORTS
// ============================
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const authRoutes = require('./routes/authRoutes'); 

app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/schedules', scheduleRoutes); 
app.use('/api/auth', authRoutes); 

// ============================
// 1. SOLICITATIONS ROUTES
// ============================
app.post('/api/solicitations', upload.fields([{ name: 'documentImage', maxCount: 1 }, { name: 'personImage', maxCount: 1 }]), (req, res) => {
  const data = req.body;
  const docFile = req.files?.documentImage?.[0]?.filename || null;
  const personFile = req.files?.personImage?.[0]?.filename || null;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const docUrl = docFile ? `${baseUrl}/uploads/${docFile}` : null;
  const personUrl = personFile ? `${baseUrl}/uploads/${personFile}` : null;

  const sql = `
    INSERT INTO solicitations
    (userId, event, date, request, venue, requisitorName, contactNo, requisitorDistrict, requisitorBarangay, remarks, documentImageUrl, personImageUrl, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;
  const values = [
    data.userId || null, data.event, data.date, data.request, data.venue, data.requisitorName,
    data.contactNo, data.requisitorDistrict, data.requisitorBarangay, data.remarks, docUrl, personUrl,
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    addActivityLog(`Added a new solicitation for ${data.requisitorName}`, data.requisitorName || 'System');
    res.status(201).json({ message: 'Solicitation created successfully', insertId: result.insertId });
  });
});

app.get('/api/solicitations', (req, res) => {
  db.query('SELECT * FROM solicitations ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put('/api/solicitations/:id/status', (req, res) => {
  const { status, note, user } = req.body;
  db.query('UPDATE solicitations SET status = ?, note = ? WHERE id = ?', [status, note || null, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      addActivityLog(`Updated solicitation status to ${status}`, user || 'Admin');
      res.json({ message: `Solicitation status updated to ${status}` });
  });
});

app.delete('/api/solicitations/:id', (req, res) => {
  const { user } = req.body;
  db.query('DELETE FROM solicitations WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addActivityLog(`Deleted solicitation ID: ${req.params.id}`, user || 'Admin');
    res.json({ message: 'Solicitation deleted successfully' });
  });
});

// ============================
// 2. MEDICAL REQUESTS ROUTES
// ============================
app.post('/api/solicitations/medical-requests', upload.fields([{ name: 'documentImage', maxCount: 1 }, { name: 'personImage', maxCount: 1 }]), (req, res) => {
  const data = req.body;
  const docFile = req.files?.documentImage?.[0]?.filename || null;
  const personFile = req.files?.personImage?.[0]?.filename || null;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const docUrl = docFile ? `${baseUrl}/uploads/${docFile}` : null;
  const personUrl = personFile ? `${baseUrl}/uploads/${personFile}` : null;

  const sql = `
    INSERT INTO medical_requests
    (userId, patientName, date, requestType, medicalIssue, contactNo, remarks, documentImageUrl, personImageUrl, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;
  const values = [
    data.userId || null, data.patientName, data.date, data.requestType, data.medicalIssue,
    data.contactNo, data.remarks, docUrl, personUrl,
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    addActivityLog(`Added a new medical request for ${data.patientName}`, data.patientName || 'System');
    res.status(201).json({ message: 'Medical Request created successfully', insertId: result.insertId });
  });
});

app.get('/api/solicitations/medical-requests', (req, res) => {
  db.query('SELECT * FROM medical_requests ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put('/api/solicitations/medical-requests/:id/status', (req, res) => {
  const { status, note, user } = req.body;
  db.query('UPDATE medical_requests SET status = ?, note = ? WHERE id = ?', [status, note || null, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      addActivityLog(`Updated medical request status to ${status}`, user || 'Admin');
      res.json({ message: `Medical request status updated to ${status}` });
  });
});

app.delete('/api/solicitations/medical-requests/:id', (req, res) => {
  const { user } = req.body;
  db.query('DELETE FROM medical_requests WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    addActivityLog(`Deleted medical request ID: ${req.params.id}`, user || 'Admin');
    res.json({ message: 'Medical request deleted successfully' });
  });
});

// ============================
// 3. TASKS ROUTES
// ============================
app.get('/api/tasks', (req, res) => {
  db.query('SELECT * FROM tasks ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tasks' });
    const tasks = results.map((t) => ({ 
        ...t, 
        completed: t.completed === 1,
        archived: t.archived === 1 
    }));
    res.json(tasks);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, description, assignedTo, createdBy } = req.body;

  db.query('INSERT INTO tasks (title, description, assignedTo, createdBy) VALUES (?, ?, ?, ?)', [title, description, assignedTo, createdBy], (err) => {
      if (err) return res.status(500).json({ error: `Database Error: ${err.message}` });

      addActivityLog(`Created a new task: '${title}' assigned to ${assignedTo}`, createdBy || 'System');

      db.query("SELECT email, fullName FROM users WHERE id = ? OR fullName = ?", [assignedTo, assignedTo], (userErr, userResults) => {
          if (!userErr && userResults.length > 0) {
              const userEmail = userResults[0].email;
              const userFullName = userResults[0].fullName;
              const subject = `New Task Assigned: ${title}`;
              const body = `Hi ${userFullName},\n\nA new task has been assigned to you by ${createdBy || 'the Admin'}.\n\nTask: ${title}\nDescription: ${description || 'No description provided'}\n\nPlease check the System for more details.\n\nThank you!`;
              sendEmail(userEmail, subject, body);
          }
      });

      res.status(201).json({ message: 'Task added successfully' });
    }
  );
});

app.put('/api/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  const { completed, user } = req.body;

  db.query("SELECT title, assignedTo FROM tasks WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Task not found' });
    const taskTitle = results[0].title;
    const assignedTo = results[0].assignedTo || 'Unassigned';

    db.query('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Failed to update task' });
        addActivityLog(`Completed a task: '${taskTitle}' assigned to ${assignedTo}`, user || 'System');
        res.json({ message: 'Task updated' });
      }
    );
  });
});

app.put('/api/tasks/:id/archive', (req, res) => {
  const { id } = req.params;
  const { user, role } = req.body;

  if (role !== 'admin' && user !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Only admins can archive tasks.' });
  }

  db.query("SELECT title FROM tasks WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Task not found' });
    const taskTitle = results[0].title;

    db.query('UPDATE tasks SET archived = 1 WHERE id = ?', [id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Failed to archive task' });
      addActivityLog(`Archived task: '${taskTitle}'`, user || 'System');
      res.json({ message: 'Task archived successfully' });
    });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { user, role } = req.body;

  if (role !== 'admin' && user !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Only admins can delete tasks.' });
  }

  db.query("SELECT title FROM tasks WHERE id = ?", [id], (err, results) => {
    const taskTitle = (results && results.length > 0) ? results[0].title : `ID ${id}`;

    db.query('DELETE FROM tasks WHERE id = ?', [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json({ error: 'Failed to delete task' });
      addActivityLog(`Deleted task: '${taskTitle}'`, user || 'Admin');
      res.json({ message: 'Task deleted' });
    });
  });
});

// ============================
// START SERVER AT SCHEDULER
// ============================
startTaskScheduler();

app.listen(PORT, () => {
  console.log(`✅ Backend is running on port ${PORT}`);
});