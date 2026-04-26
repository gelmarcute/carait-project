// Dummy database array for now
let solicitationsDB = []; // You can replace with real DB (Mongo/Mysql)


exports.getSolicitations = (req, res) => {
  res.json(solicitationsDB);
};

exports.createSolicitation = (req, res) => {
  try {
    const data = req.body;

    const docImageFile = req.files?.documentImage?.[0]?.filename || null;
    const personImageFile = req.files?.personImage?.[0]?.filename || null;

    const documentImageUrl = docImageFile ? `http://localhost:3000/uploads/${docImageFile}` : null;
    const personImageUrl = personImageFile ? `http://localhost:3000/uploads/${personImageFile}` : null;

    const newSolicitation = {
      id: Date.now().toString(),
      ...data,
      documentImageUrl,
      personImageUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    solicitationsDB.push(newSolicitation);

    res.status(201).json({
      message: 'Solicitation created successfully',
      data: newSolicitation
    });
  } catch (error) {
    console.error('Error creating solicitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateSolicitationStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const index = solicitationsDB.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  solicitationsDB[index].status = status || solicitationsDB[index].status;
  res.json({ message: 'Status updated', data: solicitationsDB[index] });
};

exports.deleteSolicitation = (req, res) => {
  const { id } = req.params;
  solicitationsDB = solicitationsDB.filter(s => s.id !== id);
  res.json({ message: 'Solicitation deleted' });
};