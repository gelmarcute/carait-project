require("dotenv").config({ path: "../.env" });

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

// ============================
// IMPORTS
// ============================

const { addActivityLog } = require("./controllers/logsController");
const { sendEmail } = require("./utils/emailHelper");
const { startTaskScheduler } = require("./utils/scheduler");

const userRoutes = require("./routes/userRoutes");
const logRoutes = require("./routes/logsRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const authRoutes = require("./routes/authRoutes");

// ============================
// APP INIT
// ============================

const app = express();

const PORT = process.env.PORT || 3000;

// ============================
// SECURITY + CORS
// ============================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: [
      // LOCALHOST
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:8081",
      "http://127.0.0.1:8081",

      // VERCEL FRONTEND
      "https://carait-project-gelmarcutes-projects.vercel.app",
    ],

    methods: ["GET", "POST", "PUT", "DELETE"],

    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// MYSQL DATABASE
// ============================

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "brgy_system",
  port: process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  dateStrings: true,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MYSQL CONNECTION ERROR:");
    console.error(err.message);
  } else {
    console.log("✅ Connected to MySQL Database");
    connection.release();
  }
});

// ============================
// FILE UPLOADS
// ============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

// ============================
// API ROUTES
// ============================

app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/auth", authRoutes);

// ============================
// ROOT TEST ROUTE
// ============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "✅ Backend is running successfully",
  });
});

// ============================
// SOLICITATIONS ROUTES
// ============================

app.post(
  "/api/solicitations",
  upload.fields([
    { name: "documentImage", maxCount: 1 },
    { name: "personImage", maxCount: 1 },
  ]),
  (req, res) => {
    const data = req.body;

    const docFile =
      req.files?.documentImage?.[0]?.filename || null;

    const personFile =
      req.files?.personImage?.[0]?.filename || null;

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const docUrl = docFile
      ? `${baseUrl}/uploads/${docFile}`
      : null;

    const personUrl = personFile
      ? `${baseUrl}/uploads/${personFile}`
      : null;

    const sql = `
      INSERT INTO solicitations
      (
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
      personUrl,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: err.message,
        });
      }

      addActivityLog(
        `Added a new solicitation for ${data.requisitorName}`,
        data.requisitorName || "System"
      );

      res.status(201).json({
        message: "Solicitation created successfully",
        insertId: result.insertId,
      });
    });
  }
);

app.get("/api/solicitations", (req, res) => {
  db.query(
    "SELECT * FROM solicitations ORDER BY createdAt DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

app.put("/api/solicitations/:id/status", (req, res) => {
  const { status, note, user } = req.body;

  db.query(
    "UPDATE solicitations SET status = ?, note = ? WHERE id = ?",
    [status, note || null, req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      addActivityLog(
        `Updated solicitation status to ${status}`,
        user || "Admin"
      );

      res.json({
        message: `Solicitation status updated to ${status}`,
      });
    }
  );
});

app.delete("/api/solicitations/:id", (req, res) => {
  const { user } = req.body;

  db.query(
    "DELETE FROM solicitations WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      addActivityLog(
        `Deleted solicitation ID: ${req.params.id}`,
        user || "Admin"
      );

      res.json({
        message: "Solicitation deleted successfully",
      });
    }
  );
});

// ============================
// TASKS ROUTES
// ============================

app.get("/api/tasks", (req, res) => {
  db.query(
    "SELECT * FROM tasks ORDER BY createdAt DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          error: "Failed to fetch tasks",
        });
      }

      const tasks = results.map((task) => ({
        ...task,
        completed: task.completed === 1,
        archived: task.archived === 1,
      }));

      res.json(tasks);
    }
  );
});

app.post("/api/tasks", (req, res) => {
  const {
    title,
    description,
    assignedTo,
    createdBy,
  } = req.body;

  const sql =
    "INSERT INTO tasks (title, description, assignedTo, createdBy) VALUES (?, ?, ?, ?)";

  db.query(
    sql,
    [title, description, assignedTo, createdBy],
    (err) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: err.message,
        });
      }

      addActivityLog(
        `Created task '${title}' assigned to ${assignedTo}`,
        createdBy || "System"
      );

      db.query(
        "SELECT email, fullName FROM users WHERE id = ? OR fullName = ?",
        [assignedTo, assignedTo],
        (userErr, userResults) => {
          if (
            !userErr &&
            userResults &&
            userResults.length > 0
          ) {
            const userEmail = userResults[0].email;

            const userFullName =
              userResults[0].fullName;

            const subject = `New Task Assigned: ${title}`;

            const body = `
Hi ${userFullName},

A new task has been assigned to you.

Task:
${title}

Description:
${description || "No description"}

Please login to the system.

Thank you!
`;

            sendEmail(userEmail, subject, body);
          }
        }
      );

      res.status(201).json({
        message: "Task created successfully",
      });
    }
  );
});

// ============================
// 404 HANDLER
// ============================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ============================
// GLOBAL ERROR HANDLER
// ============================

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:");
  console.error(err);

  res.status(500).json({
    error: "Internal server error",
  });
});

// ============================
// START TASK SCHEDULER
// ============================

startTaskScheduler();

// ============================
// START SERVER
// ============================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});