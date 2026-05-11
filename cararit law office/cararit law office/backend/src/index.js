require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================
// EXPRESS
// ============================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// DATABASE
// ============================
const db = require('./models/db');

// ============================
// HELPERS
// ============================
const { addActivityLog } = require('./controllers/logsController');
const { startTaskScheduler } = require('./utils/scheduler');

// ============================
// ERROR DEBUGGING
// ============================
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err);
});

// ============================
// TRUST PROXY & SECURITY
// ============================
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));

// ============================
// CORS
// ============================
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);
    if (origin.includes('.vercel.app')) return callback(null, true);
    if (origin.includes('.netlify.app')) return callback(null, true);
    console.log('✅ Allowed Origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================
// MANUAL HEADERS
// ============================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ============================
// BODY PARSER
// ============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================
// LOGGER
// ============================
app.use((req, res, next) => {
  console.log(`📌 ${req.method} ${req.originalUrl}`);
  next();
});

// ============================
// HEALTH CHECK
// ============================
app.get('/', (req, res) => res.status(200).json({ success: true, message: 'Backend running successfully' }));
app.get('/api/test', (req, res) => res.status(200).json({ success: true, message: 'Backend working' }));

// ============================
// DATABASE TEST
// ============================
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MYSQL CONNECTION ERROR');
    console.error(err);
    return;
  }
  console.log('✅ MYSQL CONNECTED');
  connection.release();
});

// ============================
// UPLOAD & MULTER SETUP
// ============================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf';
  if (extname && mimetype) return cb(null, true);
  return cb(new Error('Only JPG, PNG, PDF files are allowed'));
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
app.use('/uploads', express.static(uploadDir));

// ============================
// OTHER API ROUTES
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

app.get('/api/schedules-all', (req, res) => {
  db.query("SELECT * FROM schedules ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, data: results });
  });
});


// ======================================================
// 1. SOLICITATIONS ROUTES
// ======================================================

app.post('/api/solicitations', upload.fields([{ name: 'documentImage', maxCount: 1 }, { name: 'personImage', maxCount: 1 }]), (req, res) => {
  try {
    const data = req.body;
    const docFile = req.files?.documentImage?.[0]?.filename || null;
    const personFile = req.files?.personImage?.[0]?.filename || null;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const docUrl = docFile ? `${baseUrl}/uploads/${docFile}` : null;
    const personUrl = personFile ? `${baseUrl}/uploads/${personFile}` : null;

    const sql = `INSERT INTO solicitations (userId, event, date, request, venue, requisitorName, contactNo, requisitorDistrict, requisitorBarangay, remarks, documentImageUrl, personImageUrl, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
    const values = [data.userId || null, data.event, data.date, data.request, data.venue, data.requisitorName, data.contactNo, data.requisitorDistrict, data.requisitorBarangay, data.remarks, docUrl, personUrl];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      addActivityLog(`Added solicitation for ${data.requisitorName}`, data.requisitorName || 'System');
      return res.status(201).json({ success: true, message: 'Solicitation created successfully' });
    });
  } catch (error) { return res.status(500).json({ success: false, error: 'Server Error' }); }
});

app.get('/api/solicitations', (req, res) => {
  db.query("SELECT * FROM solicitations ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, data: results });
  });
});

app.put('/api/solicitations/:id/status', (req, res) => {
  const { status, note } = req.body;
  const sql = "UPDATE solicitations SET status = ?, note = ? WHERE id = ?";
  db.query(sql, [status, note, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, message: "Status updated" });
  });
});

app.delete('/api/solicitations/:id', (req, res) => {
  db.query("DELETE FROM solicitations WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.json({ success: true });
  });
});


// ======================================================
// 2. MEDICAL REQUESTS ROUTES
// ======================================================

app.post('/api/solicitations/medical-requests', upload.fields([{ name: 'documentImage', maxCount: 1 }, { name: 'personImage', maxCount: 1 }]), (req, res) => {
  try {
    const data = req.body;
    const docFile = req.files?.documentImage?.[0]?.filename || null;
    const personFile = req.files?.personImage?.[0]?.filename || null;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const docUrl = docFile ? `${baseUrl}/uploads/${docFile}` : null;
    const personUrl = personFile ? `${baseUrl}/uploads/${personFile}` : null;

    const sql = `INSERT INTO medical_requests (userId, patientName, medicalIssue, requestType, date, contactNo, remarks, documentImageUrl, personImageUrl, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
    const values = [data.userId || null, data.patientName, data.medicalIssue, data.requestType, data.date, data.contactNo, data.remarks, docUrl, personUrl];

    db.query(sql, values, (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      addActivityLog(`Added medical request for ${data.patientName}`, 'System');
      return res.status(201).json({ success: true, message: 'Medical request created successfully' });
    });
  } catch (error) { return res.status(500).json({ success: false, error: 'Server Error' }); }
});

app.get('/api/solicitations/medical-requests', (req, res) => {
  db.query("SELECT * FROM medical_requests ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, data: results });
  });
});

app.put('/api/solicitations/medical-requests/:id/status', (req, res) => {
  const { status, note } = req.body;
  const sql = "UPDATE medical_requests SET status = ?, note = ? WHERE id = ?";
  db.query(sql, [status, note, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, message: "Status updated" });
  });
});

app.delete('/api/solicitations/medical-requests/:id', (req, res) => {
  db.query("DELETE FROM medical_requests WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.json({ success: true });
  });
});


// ======================================================
// 3. TASKS ROUTES
// ======================================================

app.post('/api/tasks', (req, res) => {
  const { title, description, assignedTo, createdBy } = req.body;
  const sql = "INSERT INTO tasks (title, description, assignedTo, createdBy, completed, archived) VALUES (?, ?, ?, ?, 0, 0)";
  db.query(sql, [title, description, assignedTo, createdBy], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(201).json({ success: true, message: "Task created" });
  });
});

app.get('/api/tasks', (req, res) => {
  db.query("SELECT * FROM tasks ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, data: results });
  });
});

app.put('/api/tasks/:id/status', (req, res) => {
  const { completed } = req.body;
  const sql = "UPDATE tasks SET completed = ? WHERE id = ?";
  db.query(sql, [completed ? 1 : 0, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, message: "Task status updated" });
  });
});

app.put('/api/tasks/:id/archive', (req, res) => {
  db.query("UPDATE tasks SET archived = 1 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, message: "Task archived" });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.query("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, message: "Task deleted" });
  });
});

// ============================
// 404 ROUTE
// ============================
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ============================
// GLOBAL ERROR HANDLER
// ============================
app.use((err, req, res, next) => {
  console.error('❌ GLOBAL ERROR:', err);
  return res.status(500).json({ success: false, error: err.message || 'Something went wrong' });
});

// ============================
// START SERVER
// ============================
try { startTaskScheduler(); } catch (err) { console.log('⚠️ Scheduler skipped'); }

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});