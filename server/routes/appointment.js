const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const XLSX = require('xlsx');
const requireAuth = require('../middleware/auth');

// Multer setup for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads/appointments'); // <-- updated
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });   // <-- ensure parent dirs
    cb(null, dir);
  },
  filename: function (req, file, cb) {
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
const bulkUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return cb(new Error('Only Excel/CSV files are allowed.'));
    }
    cb(null, true);
  }
});

// ----------------- ROUTES -----------------


// Get all appointments
router.get('/appointments', (req, res) => {
  const sql = `
    SELECT 
      ad.id, 
      ad.Name, 
      ad.PositionTitle, 
      ad.SchoolOffice, 
      ad.District, 
      ad.StatusOfAppointment, 
      ad.NatureAppointment, 
      ad.ItemNo, 
      ad.DateSigned, 
      ad.pdfPath, 
      ad.remarks, 
      MAX(ar.releasedAt) AS releasedAt
    FROM \`appointment_details\` ad
    LEFT JOIN \`appointment_releases\` ar 
    ON ad.id = ar.appointmentId
    GROUP BY ad.id, 
             ad.Name, 
             ad.PositionTitle, 
             ad.SchoolOffice, 
             ad.District, 
             ad.StatusOfAppointment, 
             ad.NatureAppointment, 
             ad.ItemNo, 
             ad.DateSigned, 
             ad.pdfPath, 
             ad.remarks;
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.status(200).json(results);
  });
});

// Remarks endpoint
router.put('/appointment/:id/remarks', requireAuth, (req, res) => {
  const { remarks } = req.body;
  const id = req.params.id;

  const sql = 'UPDATE `appointment_details` SET remarks = ? WHERE id = ?';
  db.query(sql, [remarks, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to update remarks.' });
    res.status(200).json({ message: 'Remarks updated successfully!' });
  });
});

// Release appointment
router.post('/appointment/:id/release', requireAuth, (req, res) => {
  const id = req.params.id;

  const sqlCheck = 'SELECT id FROM `appointment_details` WHERE id = ?';
  db.query(sqlCheck, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error during check.' });
    if (results.length === 0) return res.status(404).json({ error: 'Appointment not found.' });

    const sqlInsert = `
      INSERT INTO \`appointment_releases\` (appointmentId, releasedAt)
      VALUES (?, NOW())
    `;

    db.query(sqlInsert, [id], (insertErr) => {
      if (insertErr) return res.status(500).json({ error: 'Database error during release.' });
      res.status(200).json({ message: 'Appointment released successfully!' });
    });
  });
});

// Get release information
router.get('/appointment/:id/release-info', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT releasedAt
    FROM \`appointment_releases\`
    WHERE appointmentId = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ error: 'No release information found for this appointment.' });

    res.status(200).json({ releasedAt: results[0].releasedAt });
  });
});


// Create appointment (with optional PDF)
router.post('/appointment', requireAuth, upload.single('pdf'), (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  console.log('Uploaded File:', req.file); // Log the uploaded file

  const {
    name,
    positionTitle,
    schoolOffice,
    district,
    statusOfAppointment,
    natureAppointment,
    itemNo,
    dateSigned,
    remarks // Include remarks in the request body
  } = req.body;

  const pdfPath = req.file ? `uploads/appointments/${req.file.filename}` : null;

  // Step 1: Check if the appointment already exists
  const checkSql = `
    SELECT * FROM \`appointment_details\` 
    WHERE \`ItemNo\` = ?
  `;

  db.query(checkSql, [itemNo], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Database Check Error:', checkErr); // Log the database error
      return res.status(500).json({ error: 'Database check error.' });
    }

    if (checkResult.length > 0) {
      // Duplicate found
      return res.status(400).json({
        error: 'Appointment already exists.',
        message: 'An appointment with this Item No. already exists.'
      });
    }

    // Step 2: Insert the new appointment if no duplicate is found
    const insertSql = `
      INSERT INTO \`appointment_details\` 
      (Name, PositionTitle, SchoolOffice, District, StatusOfAppointment, NatureAppointment, ItemNo, DateSigned, pdfPath, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [name, positionTitle, schoolOffice, district, statusOfAppointment, natureAppointment, itemNo, dateSigned, pdfPath, remarks],
      (insertErr, result) => {
        if (insertErr) {
          console.error('Database Insert Error:', insertErr); // Log the database error
          return res.status(500).json({ error: 'Database insert error.' });
        }
        res.status(201).json({ message: 'Appointment created successfully!', id: result.insertId });
      }
    );
  });
});

// Update appointment (with optional PDF replacement)
router.put('/appointment/:id', requireAuth, upload.single('pdf'), (req, res) => {
  const id = req.params.id;

  // Extract fields from request body
  const {
    name,
    positionTitle,
    schoolOffice,
    district,
    statusOfAppointment,
    natureAppointment,
    itemNo,
    dateSigned,
    remarks,
    released, // Extract released, but handle it separately
  } = req.body;

  // Format dateSigned to MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
  const formattedDateSigned = dateSigned
    ? new Date(dateSigned).toISOString().slice(0, 19).replace('T', ' ')
    : null;

  // Handle PDF upload path
  const pdfPath = req.file ? `uploads/appointments/${req.file.filename}` : null;

  // Log incoming data for debugging
  console.log('Incoming data:', {
    id,
    name,
    positionTitle,
    schoolOffice,
    district,
    statusOfAppointment,
    natureAppointment,
    itemNo,
    dateSigned: formattedDateSigned,
    remarks,
    released,
    file: req.file ? req.file.filename : null,
  });

  // Update appointment_details table
  const updateAppointmentDetailsSQL = `
    UPDATE \`appointment_details\`
    SET 
      Name = ?, 
      PositionTitle = ?, 
      SchoolOffice = ?, 
      District = ?, 
      StatusOfAppointment = ?, 
      NatureAppointment = ?, 
      ItemNo = ?, 
      DateSigned = ?, 
      remarks = ?, 
      pdfPath = COALESCE(?, pdfPath)
    WHERE id = ?
  `;

  const appointmentDetailsValues = [
    name,
    positionTitle,
    schoolOffice,
    district,
    statusOfAppointment,
    natureAppointment,
    itemNo,
    formattedDateSigned,
    remarks,
    pdfPath,
    id,
  ];

  db.query(updateAppointmentDetailsSQL, appointmentDetailsValues, (err, result) => {
    if (err) {
      console.error('Database error:', err.sqlMessage);
      return res.status(500).json({ error: 'Database error.', details: err.sqlMessage });
    }

    // If `released` is provided, update the appointment_releases table
    if (released) {
      const updateReleaseSQL = `
        UPDATE \`appointment_releases\`
        SET releasedAt = ?
        WHERE appointmentId = ?
      `;

      const releaseValues = [released, id];

      db.query(updateReleaseSQL, releaseValues, (releaseErr, releaseResult) => {
        if (releaseErr) {
          console.error('Release update error:', releaseErr.sqlMessage);
          return res.status(500).json({ error: 'Release update error.', details: releaseErr.sqlMessage });
        }

        res.status(200).json({ message: 'Appointment and release updated successfully!' });
      });
    } else {
      res.status(200).json({ message: 'Appointment updated successfully!' });
    }
  });
});

// Update releasedAt for an appointment
router.put('/appointment/:id/release', requireAuth, (req, res) => {
  const id = req.params.id;
  const { releasedAt } = req.body;

  if (!releasedAt) {
    return res.status(400).json({ error: 'releasedAt field is required.' });
  }

  const sqlCheck = 'SELECT id FROM `appointment_releases` WHERE appointmentId = ?';
  db.query(sqlCheck, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error during check.' });
    if (results.length === 0) return res.status(404).json({ error: 'Release information not found for this appointment.' });

    const sqlUpdate = `
      UPDATE \`appointment_releases\`
      SET releasedAt = ?
      WHERE appointmentId = ?
    `;

    db.query(sqlUpdate, [releasedAt, id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Database error during update.' });
      res.status(200).json({ message: 'Release date updated successfully!' });
    });
  });
});

// Delete appointment + delete PDF if exists
router.delete('/appointment/:id', requireAuth, (req, res) => {
  const id = req.params.id;

  const getSql = 'SELECT pdfPath FROM `appointment_details` WHERE id = ?';
  db.query(getSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching appointment.' });
    if (results.length === 0) return res.status(404).json({ error: 'Appointment not found.' });

    const pdfPath = results[0].pdfPath;

    const deleteSql = 'DELETE FROM `appointment_details` WHERE id = ?';
    db.query(deleteSql, [id], (err) => {
      if (err) return res.status(500).json({ error: 'Database error during delete.' });

      if (pdfPath) {
        const fullPath = path.join(__dirname, '..', pdfPath);
        fs.unlink(fullPath, (fsErr) => {
          if (fsErr && fsErr.code !== 'ENOENT') {
            console.warn('PDF deletion error:', fsErr);
          }
        });
      }

      res.status(200).json({ message: 'Appointment and PDF deleted successfully!' });
    });
  });
});

// Bulk insert (Excel/CSV file)
router.post('/appointments/bulk', requireAuth, bulkUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const filteredData = data.filter(row =>
  row.Name?.toString().trim() !== '' &&
  row.PositionTitle?.toString().trim() !== ''
);

  if (!filteredData.length) {
  return res.status(400).json({ error: 'No valid data in file.' });
}

const values = filteredData.map(row => [
  row.Name || '',
  row.PositionTitle || '',
  row.SchoolOffice || '',
  row.District || '',
  row.StatusOfAppointment || '',
  row.NatureAppointment || '',
  row.ItemNo || '',
  row.DateSigned || null,
  row.remarks || ''
]);

    const sql = `
      INSERT INTO \`appointment_details\`
      (Name, PositionTitle, SchoolOffice, District, StatusOfAppointment, NatureAppointment, ItemNo, DateSigned, remarks)
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database insertion failed.' });
      res.status(200).json({ message: `Inserted ${result.affectedRows} appointments.` });
    });

  } catch (err) {
    res.status(500).json({ error: 'File processing failed.' });
  }
});

// Bulk insert from JSON
router.post('/appointments/bulk-json', requireAuth, (req, res) => {
  const appointments = req.body;

  if (!Array.isArray(appointments) || appointments.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty data.' });
  }

  const values = appointments.map(row => [
    row.Name || '',
    row.PositionTitle || '',
    row.SchoolOffice || '',
    row.District || '',
    row.StatusOfAppointment || '',
    row.NatureAppointment || '',
    row.ItemNo || '',
    row.DateSigned || null,
    row.remarks || '' // Include remarks with a default value if not provided
  ]);

  const sql = `
    INSERT INTO \`appointment_details\` 
    (Name, PositionTitle, SchoolOffice, District, StatusOfAppointment, NatureAppointment, ItemNo, DateSigned, remarks)
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Database insertion error:', err);
      return res.status(500).json({ error: 'Database insertion failed.' });
    }
    res.status(200).json({ message: `Inserted ${result.affectedRows} appointments.` });
  });
});

// Bulk upsert: update if exists (by ItemNo), insert if not
router.post('/appointments/bulk-update', requireAuth, (req, res) => {
  let appointments = req.body;

  if (!Array.isArray(appointments) || appointments.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty update payload.' });
  }

  // 🔍 Filter out rows that are completely empty or filled with whitespace
  appointments = appointments.filter(row => {
    return Object.values(row).some(
      value => String(value || '').trim() !== ''
    );
  });

  if (appointments.length === 0) {
    return res.status(400).json({ error: 'All rows are blank or whitespace only.' });
  }

  const values = appointments.map(row => [
    row.Name || '',
    row.PositionTitle || '',
    row.SchoolOffice || '',
    row.District || '',
    row.StatusOfAppointment || '',
    row.NatureAppointment || '',
    row.ItemNo || '',
    row.DateSigned || null,
    row.remarks === '' ? null : row.remarks // Convert empty remarks to NULL
  ]);

  const sql = `
    INSERT INTO \`appointment_details\` 
      (Name, PositionTitle, SchoolOffice, District, StatusOfAppointment, NatureAppointment, ItemNo, DateSigned, remarks)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      Name = VALUES(Name),
      PositionTitle = VALUES(PositionTitle),
      SchoolOffice = VALUES(SchoolOffice),
      District = VALUES(District),
      StatusOfAppointment = VALUES(StatusOfAppointment),
      NatureAppointment = VALUES(NatureAppointment),
      DateSigned = VALUES(DateSigned),
      remarks = VALUES(remarks)
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Upsert error:', err);
      return res.status(500).json({ error: 'Bulk upsert failed.' });
    }

    res.status(200).json({ message: `Bulk update complete. ${result.affectedRows} rows affected.` });
  });
});




router.post('/check-existence', (req, res) => {
  const { name, itemNo } = req.body;

  if (!name && !itemNo) {
    return res.status(400).json({
      error: 'Both name and itemNo are required for validation.',
    });
  }

  const sql = 'SELECT id FROM `appointment_details` WHERE `Name` = ? OR `ItemNo` = ?';
  db.query(sql, [name, itemNo], (err, results) => {
    if (err) {
      console.error('Error checking appointment existence:', err);
      return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }

    if (results.length > 0) {
      return res.status(200).json({
        exists: true,
        message: 'An appointment with this Name or Item No. already exists.',
      });
    }

    return res.status(200).json({
      exists: false,
      message: 'No duplicate appointment found.',
    });
  });
});

module.exports = router;
