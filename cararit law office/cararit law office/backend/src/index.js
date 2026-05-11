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
const PORT = process.env.PORT || 8080;

// ============================
// DATABASE
// ============================

const db = require('./models/db');

// ============================
// HELPERS
// ============================

const {
  addActivityLog
} = require('./controllers/logsController');

const {
  startTaskScheduler
} = require('./utils/scheduler');

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
// TRUST PROXY
// ============================

app.set('trust proxy', 1);

// ============================
// SECURITY
// ============================

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

// ============================
// CORS FIX
// ============================

const corsOptions = {

  origin: (origin, callback) => {

    // allow postman/mobile apps
    if (!origin) {
      return callback(null, true);
    }

    // allow localhost
    if (origin.includes('localhost')) {
      return callback(null, true);
    }

    // allow vercel
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // allow netlify
    if (origin.includes('.netlify.app')) {
      return callback(null, true);
    }

    console.log('✅ Allowed Origin:', origin);

    return callback(null, true);
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ]
};

app.use(cors(corsOptions));

// ============================
// PREFLIGHT FIX
// ============================

app.options('*', cors(corsOptions));

// ============================
// MANUAL HEADERS
// ============================

app.use((req, res, next) => {

  const origin = req.headers.origin;

  if (origin) {
    res.header(
      'Access-Control-Allow-Origin',
      origin
    );
  }

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  res.header(
    'Access-Control-Allow-Credentials',
    'true'
  );

  res.header(
    'Vary',
    'Origin'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// ============================
// BODY PARSER
// ============================

app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// ============================
// LOGGER
// ============================

app.use((req, res, next) => {

  console.log(
    `📌 ${req.method} ${req.originalUrl}`
  );

  next();
});

// ============================
// HEALTH CHECK
// ============================

app.get('/', (req, res) => {

  return res.status(200).json({
    success: true,
    message: 'Backend running successfully'
  });
});

app.get('/api/test', (req, res) => {

  return res.status(200).json({
    success: true,
    message: 'Backend working'
  });
});

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
// UPLOAD DIRECTORY
// ============================

const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {

  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

// ============================
// MULTER STORAGE
// ============================

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

// ============================
// FILE FILTER
// ============================

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

  return cb(
    new Error(
      'Only JPG, PNG, PDF files are allowed'
    )
  );
};

// ============================
// MULTER
// ============================

const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter
});

// ============================
// STATIC FILES
// ============================

app.use(
  '/uploads',
  express.static(uploadDir)
);

// ============================
// ROUTES
// ============================

const userRoutes =
  require('./routes/userRoutes');

const logRoutes =
  require('./routes/logsRoutes');

const inventoryRoutes =
  require('./routes/inventoryRoutes');

const scheduleRoutes =
  require('./routes/scheduleRoutes');

const authRoutes =
  require('./routes/authRoutes');

// ============================
// API ROUTES
// ============================

app.use(
  '/api/users',
  userRoutes
);

app.use(
  '/api/logs',
  logRoutes
);

app.use(
  '/api/inventory',
  inventoryRoutes
);

app.use(
  '/api/schedules',
  scheduleRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

// ============================
// SOLICITATIONS
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
        req.files?.documentImage?.[0]?.filename || null;

      const personFile =
        req.files?.personImage?.[0]?.filename || null;

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

      db.query(
        sql,
        values,
        (err, result) => {

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

          return res.status(201).json({
            success: true,
            message: 'Solicitation created successfully',
            insertId: result.insertId
          });
        }
      );

    } catch (error) {

      console.error(error);

      return res.status(500).json({
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

  return res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ============================
// GLOBAL ERROR HANDLER
// ============================

app.use((err, req, res, next) => {

  console.error(
    '❌ GLOBAL ERROR:',
    err
  );

  return res.status(500).json({
    success: false,
    error:
      err.message ||
      'Something went wrong'
  });
});

// ============================
// START SCHEDULER
// ============================

try {

  startTaskScheduler();

} catch (err) {

  console.log('⚠️ Scheduler skipped');
}

// ============================
// START SERVER
// ============================

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `🚀 Server running on port ${PORT}`
    );
  }
);