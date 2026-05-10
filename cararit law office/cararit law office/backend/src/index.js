require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================
// DATABASE
// ============================

const db = require('./models/db');

// ============================
// CONTROLLERS / HELPERS
// ============================

const {
  addActivityLog
} = require('./controllers/logsController');

const {
  sendEmail
} = require('./utils/emailHelper');

const {
  startTaskScheduler
} = require('./utils/scheduler');

// ============================
// EXPRESS APP
// ============================

const app = express();

const PORT = process.env.PORT || 3000;

// ============================
// TRUST PROXY (RAILWAY)
// ============================

app.set('trust proxy', 1);

// ============================
// CORS
// ============================

const allowedOrigins = [

  'https://caraitoffice.netlify.app',

  'https://carait-project-gelmarcutes-projects.vercel.app',

  'https://carait-project-git-main-gelmarcutes-projects.vercel.app',

  'http://localhost:5173',

  'http://localhost:3000'
];

const corsOptions = {

  origin: function(origin, callback) {

    // Allow Postman / Mobile Apps

    if (!origin) {

      return callback(null, true);
    }

    // Allow Frontend Domains

    if (allowedOrigins.includes(origin)) {

      return callback(null, true);
    }

    console.log('❌ BLOCKED ORIGIN:', origin);

    return callback(
      new Error('Not allowed by CORS')
    );
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
    'Content-Type',
    'Authorization'
  ]
};

// ============================
// APPLY CORS
// ============================

app.use(cors(corsOptions));

// IMPORTANT FOR PREFLIGHT
app.options('*', cors(corsOptions));

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
// SECURITY
// ============================

app.use(helmet({
  crossOriginResourcePolicy: false
}));

// ============================
// REQUEST LOGGER
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

// ============================
// TEST ROUTE
// ============================

app.get('/api/test', (req, res) => {

  return res.status(200).json({

    success: true,

    message: 'Backend working'
  });
});

// ============================
// DATABASE CONNECTION TEST
// ============================

db.getConnection((err, connection) => {

  if (err) {

    console.error(
      '❌ MYSQL CONNECTION ERROR'
    );

    console.error(err);

    return;
  }

  console.log(
    '✅ MYSQL CONNECTED'
  );

  connection.release();
});

// ============================
// UPLOAD DIRECTORY
// ============================

const uploadDir = path.join(
  __dirname,
  'uploads'
);

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

const fileFilter = (

  req,
  file,
  cb

) => {

  const allowedTypes =
    /jpeg|jpg|png|pdf/;

  const extname = allowedTypes.test(

    path.extname(
      file.originalname
    ).toLowerCase()
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
    fileSize:
      10 * 1024 * 1024
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

            message:
              'Solicitation created successfully',

            insertId:
              result.insertId
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

app.use((

  err,
  req,
  res,
  next

) => {

  console.error('❌ GLOBAL ERROR:', err);

  return res.status(500).json({

    success: false,

    error:
      err.message ||
      'Something went wrong'
  });
});

// ============================
// START TASK SCHEDULER
// ============================

startTaskScheduler();

// ============================
// START SERVER
// ============================

app.listen(PORT, '0.0.0.0', () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );
});