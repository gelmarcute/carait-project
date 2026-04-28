require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const { startTaskScheduler } = require('./utils/scheduler');

const app = express();

/* ============================
   ✅ PORT
============================ */
const PORT = process.env.PORT || 3000;

/* ============================
   ✅ MIDDLEWARES
============================ */
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://carait-project.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

/* ============================
   ✅ DATABASE (LOCAL)
============================ */
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brgy_system',
  waitForConnections: true,
  connectionLimit: 10,
});

// test connection
db.getConnection((err, conn) => {
  if (err) {
    console.error('❌ DB ERROR:', err.message);
  } else {
    console.log('✅ DB CONNECTED');
    conn.release();
  }
});

// export DB para magamit sa controllers
module.exports = db;

/* ============================
   UPLOADS
============================ */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

/* ============================
   ROUTES
============================ */
app.use('/api/auth', require('./routes/authRoutes'));

/* ============================
   TEST
============================ */
app.get('/', (req, res) => {
  res.send('🚀 API working');
});

/* ============================
   START
============================ */
startTaskScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});