const express = require("express");
const router = express.Router();

const multer = require("multer");
const solicitationController = require("../controllers/solicitationController");

// ==========================
// MULTER
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({ storage });

// ==========================
// SOLICITATIONS
// ==========================
router.get(
  "/",
  solicitationController.getSolicitations
);

router.post(
  "/",
  upload.fields([
    { name: "documentImage", maxCount: 1 },
    { name: "personImage", maxCount: 1 },
  ]),
  solicitationController.createSolicitation
);

router.put(
  "/:id/status",
  solicitationController.updateSolicitationStatus
);

router.delete(
  "/:id",
  solicitationController.deleteSolicitation
);

// ==========================
// MEDICAL REQUESTS
// ==========================
router.get(
  "/medical-requests",
  solicitationController.getMedicalRequests
);

router.post(
  "/medical-requests",
  upload.fields([
    { name: "documentImage", maxCount: 1 },
    { name: "personImage", maxCount: 1 },
  ]),
  solicitationController.createMedicalRequest
);

router.put(
  "/medical-requests/:id/status",
  solicitationController.updateMedicalRequestStatus
);

router.delete(
  "/medical-requests/:id",
  solicitationController.deleteMedicalRequest
);

module.exports = router;