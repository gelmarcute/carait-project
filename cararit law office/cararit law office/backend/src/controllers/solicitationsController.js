const db = require('../models/db'); 
const { addActivityLog } = require('./logsController'); 

exports.getSolicitations = (req, res) => {
  db.query('SELECT * FROM solicitations ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.createSolicitation = (req, res) => {
  const data = req.body;
  
  const docFile = req.files?.documentImage?.[0]?.filename || null;
  const personFile = req.files?.personImage?.[0]?.filename || null;

  const docUrl = docFile ? `http://localhost:3000/uploads/${docFile}` : null;
  const personUrl = personFile ? `http://localhost:3000/uploads/${personFile}` : null;

  const sql = `
    INSERT INTO solicitations 
    (userId, event, date, request, venue, requisitorName, contactNo, requisitorDistrict, requisitorBarangay, remarks, documentImageUrl, personImageUrl, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const values = [
    data.userId || null, data.event, data.date, data.request, data.venue,
    data.requisitorName, data.contactNo, data.requisitorDistrict, data.requisitorBarangay,
    data.remarks, docUrl, personUrl
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    addActivityLog(`Added a new solicitation for ${data.requisitorName}`, data.requisitorName || 'System');
    res.status(201).json({ message: 'Solicitation created successfully', insertId: result.insertId });
  });
};

exports.updateSolicitationStatus = (req, res) => {
  const { status, note, user } = req.body;
  
  db.query('UPDATE solicitations SET status = ?, note = ? WHERE id = ?', [status, note || null, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    addActivityLog(`Updated solicitation status to ${status}`, user || 'Admin');
    res.json({ message: 'Solicitation status updated' });
  });
};

exports.deleteSolicitation = (req, res) => {
  const { user } = req.body;

  db.query('DELETE FROM solicitations WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    addActivityLog(`Deleted solicitation ID: ${req.params.id}`, user || 'Admin');
    res.json({ message: 'Deleted successfully' });
  });
};