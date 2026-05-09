require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const dbModel = require('./models/db');

const { addActivityLog } = require('./controllers/logsController');
const { sendEmail } = require('./utils/emailHelper');
const { startTaskScheduler } = require('./utils/scheduler');

const app = express();

const PORT = process.env.PORT || 3000;

// ============================
// SECURITY & MIDDLEWARES
// ============================

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

const corsOptions = {
  origin: [
    'https://caraitoffice.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept'
  ],

  credentials: true
};

app.use(cors(corsOptions));

// ❌ REMOVE THIS
// app.options('*', cors(corsOptions));

// ✅ FIXED VERSION
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true
  })
);

// ============================
// HEALTH CHECK
// ============================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend running successfully'
  });
});

// ============================
// DATABASE CONNECTION
// ============================

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

db.getConnection((err, connection) => {

  if (err) {

    console.error('❌ MySQL Connection Error');

    console.error(err.message);

    return;
  }

  console.log('✅ Connected to MySQL Database');

  connection.release();
});

// ============================
// UPLOADS CONFIGURATION
// ============================

const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {

  const allowedTypes = /jpeg|jpg|png|pdf/;

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimetype =
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(
    new Error(
      'Only JPG, PNG, and PDF files are allowed'
    )
  );
};

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter
});

app.use('/uploads', express.static(uploadDir));

// ============================
// ROUTES IMPORT
// ============================

const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const authRoutes = require('./routes/authRoutes');

// ============================
// API ROUTES
// ============================

app.use('/api/users', userRoutes);

app.use('/api/logs', logRoutes);

app.use('/api/inventory', inventoryRoutes);

app.use('/api/schedules', scheduleRoutes);

app.use('/api/auth', authRoutes);

// ============================
// SOLICITATIONS ROUTES
// ============================

app.post(
  '/api/solicitations',

  upload.fields([
    {
      name: 'documentImage',
      maxCount: 1
    },

    {
      name: 'personImage',
      maxCount: 1
    }
  ]),

  (req, res) => {

    try {

      const data = req.body;

      const docFile =
        req.files?.documentImage?.[0]?.filename ||
        null;

      const personFile =
        req.files?.personImage?.[0]?.filename ||
        null;

      const baseUrl =
        `${req.protocol}://${req.get('host')}`;

      const docUrl =
        docFile
          ? `${baseUrl}/uploads/${docFile}`
          : null;

      const personUrl =
        personFile
          ? `${baseUrl}/uploads/${personFile}`
          : null;

      const sql = `
        INSERT INTO solicitations (
          userId,
          event,
          date,
          request,
          venue,
          requisitorName,
          contactNo,
          requisitorDistrict,
          requisitorBarangay,
          remarks,
          documentImageUrl,
          personImageUrl,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `;

      const values = [
        data.userId || null,
        data.event,
        data.date,
        data.request,
        data.venue,
        data.requisitorName,
        data.contactNo,
        data.requisitorDistrict,
        data.requisitorBarangay,
        data.remarks,
        docUrl,
        personUrl
      ];

      db.query(sql, values, (err, result) => {

        if (err) {

          console.error(err);

          return res.status(500).json({
            success: false,
            error: err.message
          });
        }

        addActivityLog(
          `Added solicitation for ${data.requisitorName}`,
          data.requisitorName || 'System'
        );

        res.status(201).json({
          success: true,
          message: 'Solicitation created successfully',
          insertId: result.insertId
        });
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
);

// ============================
// 404 ROUTE
// ============================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ============================
// ERROR HANDLER
// ============================

app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: err.message || 'Something went wrong'
  });
});

// ============================
// START TASK SCHEDULER
// ============================

startTaskScheduler();

// ============================
// START SERVER
// ============================

app.listen(PORT, () => {

  console.log(
    `✅ Server running on port ${PORT}`
  );
});