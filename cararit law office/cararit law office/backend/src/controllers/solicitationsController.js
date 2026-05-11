let solicitationsDB = [];
let medicalRequestsDB = [];

// ==========================
// GET ALL SOLICITATIONS
// ==========================
exports.getSolicitations = (req, res) => {
  try {
    const { userId, role } = req.query;

    if (role === "admin") {
      return res.json(solicitationsDB);
    }

    const filtered = solicitationsDB.filter(
      (item) => item.userId === userId
    );

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch solicitations" });
  }
};

// ==========================
// CREATE SOLICITATION
// ==========================
exports.createSolicitation = (req, res) => {
  try {
    const data = req.body;

    const docImageFile =
      req.files?.documentImage?.[0]?.filename || null;

    const personImageFile =
      req.files?.personImage?.[0]?.filename || null;

    const newSolicitation = {
      id: Date.now().toString(),
      ...data,
      documentImageUrl: docImageFile
        ? `http://localhost:3000/uploads/${docImageFile}`
        : null,
      personImageUrl: personImageFile
        ? `http://localhost:3000/uploads/${personImageFile}`
        : null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    solicitationsDB.push(newSolicitation);

    res.status(201).json({
      message: "Solicitation created",
      data: newSolicitation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Create failed" });
  }
};

// ==========================
// UPDATE STATUS
// ==========================
exports.updateSolicitationStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const item = solicitationsDB.find((s) => s.id === id);

    if (!item) {
      return res.status(404).json({
        error: "Solicitation not found",
      });
    }

    item.status = status || item.status;
    item.note = note || item.note;

    res.json({
      message: "Updated successfully",
      data: item,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
};

// ==========================
// DELETE
// ==========================
exports.deleteSolicitation = (req, res) => {
  try {
    const { id } = req.params;

    solicitationsDB = solicitationsDB.filter(
      (item) => item.id !== id
    );

    res.json({
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Delete failed" });
  }
};

// =====================================================
// MEDICAL REQUESTS
// =====================================================

exports.getMedicalRequests = (req, res) => {
  try {
    const { userId, role } = req.query;

    if (role === "admin") {
      return res.json(medicalRequestsDB);
    }

    const filtered = medicalRequestsDB.filter(
      (item) => item.userId === userId
    );

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch medical requests" });
  }
};

exports.createMedicalRequest = (req, res) => {
  try {
    const data = req.body;

    const docImageFile =
      req.files?.documentImage?.[0]?.filename || null;

    const personImageFile =
      req.files?.personImage?.[0]?.filename || null;

    const newRequest = {
      id: Date.now().toString(),
      ...data,
      documentImageUrl: docImageFile
        ? `http://localhost:3000/uploads/${docImageFile}`
        : null,
      personImageUrl: personImageFile
        ? `http://localhost:3000/uploads/${personImageFile}`
        : null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    medicalRequestsDB.push(newRequest);

    res.status(201).json({
      message: "Medical request created",
      data: newRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Create failed" });
  }
};

exports.updateMedicalRequestStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const item = medicalRequestsDB.find(
      (m) => m.id === id
    );

    if (!item) {
      return res.status(404).json({
        error: "Medical request not found",
      });
    }

    item.status = status || item.status;
    item.note = note || item.note;

    res.json({
      message: "Updated",
      data: item,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
};

exports.deleteMedicalRequest = (req, res) => {
  try {
    const { id } = req.params;

    medicalRequestsDB = medicalRequestsDB.filter(
      (m) => m.id !== id
    );

    res.json({
      message: "Deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Delete failed" });
  }
};