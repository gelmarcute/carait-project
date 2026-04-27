require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const { addActivityLog } = require('./controllers/logsController'); 
const { sendEmail } = require('./utils/emailHelper'); 
const { startTaskScheduler } = require('./utils/scheduler'); 

const app = express();

/* ============================
   ✅ PORT FIX (IMPORTANT)
============================ */
const PORT = process.env.PORT || 3000;

/* ============================
   MIDDLEWARES
============================ */
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

/* ============================
   ✅ DATABASE (RAILWAY READY)
============================ */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection (safe)
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err.message);
  } else {
    console.log('✅ Connected to MySQL (Railway)');
    connection.release();
  }
});

/* ============================
   UPLOADS (MULTER)
============================ */
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

/* ============================
   ROUTES
============================ */
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/logs', require('./routes/logsRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes')); 
app.use('/api/auth', require('./routes/authRoutes')); 

/* ============================
   SAMPLE ROUTE (TEST)
============================ */
app.get('/', (req, res) => {
  res.send('🚀 API is running...');
});

/* ============================
   TASKS (example kept)
============================ */
app.get('/api/tasks', (req, res) => {
  db.query('SELECT * FROM tasks ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tasks' });

    const tasks = results.map(t => ({
      ...t,
      completed: t.completed === 1,
      archived: t.archived === 1
    }));

    res.json(tasks);
  });
});

/* ============================
   RESET PASSWORD (OPTIONAL)
============================ */
app.get('/api/reset-all', async (req, res) => {
  try {
    const newPassword = await bcrypt.hash('123456', 10);
    db.query("UPDATE users SET password = ?", [newPassword], (err) => {
      if (err) return res.send("Error: " + err.message);
      res.send("✅ All passwords reset");
    });
  } catch {
    res.send("Error hashing");
  }
});

/* ============================
   START SCHEDULER
============================ */
startTaskScheduler();

/* ============================
   START SERVER (IMPORTANT)
============================ */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});