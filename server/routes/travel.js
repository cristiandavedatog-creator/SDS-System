const express = require('express');
const db = require('../db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
// Get all travels
router.get('/travels', (req, res) => {
  const sql = `
    SELECT 
      t.*, 
      e.fullname 
    FROM travelauthority t
    LEFT JOIN employee e ON t.employee_ID = e.uid
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.', details: err.message });
    res.status(200).json(results);
  });
});


// Graph endpoint
router.get('/travels/graph', (req, res) => {
  const { type, year, month, position, station } = req.query;

  // Validate the "type" parameter
  if (!['week', 'month', 'year'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  // Dynamic group format for each type
  const groupFormat = {
    week: {
      label: "CONCAT(YEAR(DatesFrom), '-W', LPAD(WEEK(DatesFrom), 2, '0'))",
      groupBy: 'label',
    },
    month: {
      label: "CONCAT(YEAR(DatesFrom), '-', LPAD(MONTH(DatesFrom), 2, '0'))",
      groupBy: 'label',
    },
    year: {
      label: 'YEAR(DatesFrom)',
      groupBy: 'label',
    },
  }[type];

  let query = `SELECT ${groupFormat.label} AS label, COUNT(*) AS count 
               FROM travelauthority 
               WHERE DatesFrom IS NOT NULL`;
  const params = [];

  // Add year filter
  if (year) {
    query += ' AND YEAR(DatesFrom) = ?';
    params.push(Number(year));
  }

  // Add month filter if "Weekly" is selected
  if (month && type === 'week') {
    query += ' AND MONTH(DatesFrom) = ?';
    params.push(Number(month));
  }

  // Add position filter
  if (position && position !== 'All') {
    query += ' AND PositionDesignation LIKE ?';
    params.push(`%${position}%`);
  }

  // Add station filter
  if (station && station !== 'All') {
    query += ' AND Station LIKE ?';
    params.push(`%${station}%`);
  }

  // Group by the alias "label"
  query += ` GROUP BY ${groupFormat.groupBy} ORDER BY ${groupFormat.groupBy}`;

  // Debugging: Log the query and parameters
  console.log('SQL Query:', query);
  console.log('Parameters:', params);

  // Execute the query
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Query Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve graph data', details: err.message });
    }

    // Format the response
    const response = {
      labels: results.map((r) => r.label),
      datasets: [
        {
          label: `Travel Entries by ${type}`,
          data: results.map((r) => r.count),
          backgroundColor: 'rgba(76, 175, 80, 0.3)',
          borderColor: '#4caf50',
        },
      ],
    };

    res.json(response);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'travels');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  }
});

// Insert a new travel
// Modify POST route to handle file
// Insert a new travel with duplication check
router.post('/travels', requireAuth, upload.single('attachment'), (req, res) => {
  console.log('Received form data:', req.body);
  console.log('Received file:', req.file?.originalname);

  const {
    employee_ID, PositionDesignation, Station,
    Purpose, Host, DatesFrom, DatesTo,
    Destination, Area, sof
  } = req.body;

  const attachmentPath = req.file ? `/uploads/travels/${req.file.filename}` : null;

  // Define duplication check: same employee, DatesFrom, Purpose, Destination
  const duplicateSql = `
    SELECT * FROM travelauthority 
    WHERE employee_ID = ? AND DatesFrom = ? AND Purpose = ? AND Destination = ?
  `;
  const duplicateParams = [employee_ID, DatesFrom, Purpose, Destination];

  db.query(duplicateSql, duplicateParams, (dupErr, dupResults) => {
    if (dupErr) {
      console.error('Duplication check error:', dupErr);
      return res.status(500).json({ error: 'Database error during duplication check', details: dupErr.message });
    }
    if (dupResults.length > 0) {
      return res.status(409).json({ error: 'Duplicate travel entry found for this employee, date, purpose, and destination.' });
    }

    // Proceed to insert
    const values = [
      employee_ID, DatesFrom, DatesTo, Purpose,
      PositionDesignation, Station, Host, sof,
      Destination, Area, attachmentPath
    ];

    console.log('SQL INSERT VALUES:', values);

    const sql = `
      INSERT INTO travelauthority 
      (employee_ID, DatesFrom, DatesTo, Purpose, PositionDesignation,
       Station, Host, sof, Destination, Area, Attachment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('INSERT travel error:', err);
        return res.status(500).json({ error: 'Failed to insert travel', details: err.message });
      }

      res.status(201).json({ message: 'Travel added', travelId: result.insertId });
    });
  });
});

//admin edits
// Update travel record with optional PDF upload
router.put('/travels/:id', requireAuth, upload.single('attachment'), (req, res) => {
  const {
    PositionDesignation, Station, Destination,
    Purpose, Host, sof, Area, DatesFrom, DatesTo
  } = req.body;
  const id = req.params.id;

  const updates = [
    'PositionDesignation = ?', 'Station = ?', 'Destination = ?',
    'Purpose = ?', 'Host = ?', 'sof = ?', 'Area = ?',
    'DatesFrom = ?', 'DatesTo = ?'
  ];
  const values = [
    PositionDesignation, Station, Destination,
    Purpose, Host, sof, Area,
    DatesFrom, DatesTo
  ];

  if (req.file) {
    updates.push('Attachment = ?');
    values.push(`/uploads/travels/${req.file.filename}`);
  }

  const sql = `UPDATE travelauthority SET ${updates.join(', ')} WHERE id = ?`;
  values.push(id);

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: 'Update failed', details: err.message });
    res.json({ message: 'Travel updated successfully' });
  });
});

//delete travel record
router.delete('/travels/:id', requireAuth, (req, res) => {
  const sql = 'DELETE FROM travelauthority WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete', details: err.message });
    res.status(200).json({ message: 'Deleted successfully' });
  });
});




module.exports = router;