const express = require('express');
const db = require('../db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const { extractTravelPdf } = require('../utils/extractTravelPdf');
// Get all travels
router.get('/travels', (req, res) => {
  const sql = `
    SELECT
      t.*,
      e.fullname
    FROM travelauthority t
    LEFT JOIN employee e ON t.employee_ID = e.uid
    ORDER BY t.id DESC
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

// Numeric totals for the Statistics page: travels in a chosen year, in a
// chosen month of that year, and in the current calendar week (Mon-Sun).
router.get('/travels/stats', (req, res) => {
  const now = new Date();
  const yearNum = req.query.year ? Number(req.query.year) : now.getFullYear();
  const monthNum = req.query.month ? Number(req.query.month) : now.getMonth() + 1;

  const query = `
    SELECT
      SUM(CASE WHEN YEAR(DatesFrom) = ? THEN 1 ELSE 0 END) AS yearTotal,
      SUM(CASE WHEN YEAR(DatesFrom) = ? AND MONTH(DatesFrom) = ? THEN 1 ELSE 0 END) AS monthTotal,
      SUM(CASE WHEN YEARWEEK(DatesFrom, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) AS weekTotal
    FROM travelauthority
    WHERE DatesFrom IS NOT NULL
  `;

  db.query(query, [yearNum, yearNum, monthNum], (err, results) => {
    if (err) {
      console.error('Query Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve travel stats', details: err.message });
    }

    const row = results[0];
    res.json({
      year: yearNum,
      month: monthNum,
      yearTotal: Number(row.yearTotal) || 0,
      monthTotal: Number(row.monthTotal) || 0,
      weekTotal: Number(row.weekTotal) || 0,
    });
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

// In-memory (not disk) — this is just a read-only preview of the PDF's
// text, never saved as a travel's attachment, so there's no reason to
// write it to uploads/travels and leave an orphaned file behind.
const extractUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  }
});

function normalizeEmployeeName(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/,?\s*(JR|SR|II|III|IV|CESO\s*[IVX]+)\.?$/i, '') // strip trailing suffixes
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// A handful of characters OCR commonly confuses for letters that look
// nearly identical in most fonts (seen repeatedly on real scans in this
// project — e.g. "K1MVERLY", "SONNY R. 1CO") — folded together only for
// the comparison key, never for what's actually displayed or stored, so
// a misread digit doesn't stop a real employee from being found. Applying
// this to a clean DB name (which never contains digits) is a no-op, so
// it's safe to run on both sides uniformly.
function matchingKey(name) {
  return normalizeEmployeeName(name)
    .replace(/1/g, 'I')
    .replace(/0/g, 'O')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B');
}

// Matches each name the PDF listed as a traveler against the employee
// table, so Position/Station come from that employee's actual record (the
// source of truth) instead of being guessed from the PDF's own text —
// which is often just "As stated above" for every traveler anyway. Only
// an exact match (after normalizing case/punctuation/suffixes) is
// trusted; a name that doesn't match anything still comes back as its
// own entry (uid blank) so the admin can search for them manually
// instead of that traveler silently disappearing.
function matchTravelersToEmployees(travelerNames) {
  return new Promise((resolve) => {
    if (!travelerNames.length) return resolve([]);
    db.query('SELECT uid, fullname, office, positionTitle, Initial FROM employee', (err, employees) => {
      if (err || !employees.length) {
        resolve(travelerNames.map((name) => ({ uid: '', name, position: '', station: '', initial: '', matched: false })));
        return;
      }
      resolve(travelerNames.map((name) => {
        const target = matchingKey(name);
        const match = employees.find((e) => matchingKey(e.fullname) === target);
        return match
          ? { uid: match.uid, name: match.fullname, position: match.positionTitle, station: match.office, initial: match.Initial, matched: true }
          : { uid: '', name, position: '', station: '', initial: '', matched: false };
      }));
    });
  });
}

// Best-effort field extraction from an uploaded PDF, for auto-filling the
// Create Travel form. Never writes anything to the database — reads the
// PDF's own text layer if it has one, falls back to OCR on page 1 if not,
// and returns whatever it could confidently match, null for everything
// else so the admin fills those in by hand. Traveler names are matched
// against the employee table to pull Position/Station from there (see
// matchTravelersToEmployees above) rather than parsed from the PDF text.
router.post('/travels/extract-pdf', requireAuth, extractUpload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });

  try {
    const { hasText, fields } = await extractTravelPdf(req.file.buffer);
    const { travelerNames, ...restFields } = fields;
    const travelers = await matchTravelersToEmployees(travelerNames || []);
    res.status(200).json({ hasText, fields: { ...restFields, travelers } });
  } catch (err) {
    console.error('Travel PDF extraction error:', err);
    res.status(500).json({ error: 'Failed to read the PDF.' });
  }
});

// Insert a new travel
// Modify POST route to handle file
// Insert a new travel with duplication check
router.post('/travels', requireAuth, upload.single('attachment'), (req, res) => {
  const {
    employee_ID, PositionDesignation, Station,
    Purpose, Host, DatesFrom, DatesTo,
    Destination, Area
  } = req.body;
  // This office only ever funds travel out of Local Fund — fixed
  // server-side (not just hidden/disabled on the form) so it holds
  // regardless of what any client sends.
  const sof = 'Local Fund';

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
    Purpose, Host, Area, DatesFrom, DatesTo
  } = req.body;
  // Fixed server-side — see the matching comment in POST /travels above.
  const sof = 'Local Fund';
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

// Bulk upsert from an Excel/CSV import: same identity as the single-create
// duplication check above (employee_ID + DatesFrom + Purpose + Destination)
// — matching rows are updated in place, everything else is inserted. Rows
// with no matching employee_ID are skipped since the FK would otherwise
// reject the whole insert.
router.post('/travels/bulk-insert', requireAuth, async (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty data.' });
  }

  const promiseDb = db.promise();
  const sof = 'Local Fund'; // fixed server-side — see the matching comment on POST /travels above.
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const employee_ID = row.employee_ID;
    const DatesFrom = row.DatesFrom;
    const DatesTo = row.DatesTo;
    const Purpose = row.Purpose || '';
    const Destination = row.Destination || '';
    const PositionDesignation = row.PositionDesignation || '';
    const Station = row.Station || '';
    const Host = row.Host || '';
    const Area = row.Area || '';

    if (!employee_ID || !DatesFrom || !DatesTo) {
      skipped++;
      continue;
    }

    try {
      const [empRows] = await promiseDb.query('SELECT uid FROM employee WHERE uid = ?', [employee_ID]);
      if (empRows.length === 0) {
        skipped++;
        continue;
      }

      const [existing] = await promiseDb.query(
        'SELECT id FROM travelauthority WHERE employee_ID = ? AND DatesFrom = ? AND Purpose = ? AND Destination = ?',
        [employee_ID, DatesFrom, Purpose, Destination]
      );

      if (existing.length > 0) {
        await promiseDb.query(
          `UPDATE travelauthority
           SET DatesTo = ?, PositionDesignation = ?, Station = ?, Host = ?, sof = ?, Area = ?
           WHERE id = ?`,
          [DatesTo, PositionDesignation, Station, Host, sof, Area, existing[0].id]
        );
        updated++;
      } else {
        await promiseDb.query(
          `INSERT INTO travelauthority
             (employee_ID, DatesFrom, DatesTo, Purpose, PositionDesignation, Station, Host, sof, Destination, Area)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [employee_ID, DatesFrom, DatesTo, Purpose, PositionDesignation, Station, Host, sof, Destination, Area]
        );
        inserted++;
      }
    } catch (err) {
      console.error('Bulk travel row error:', err);
      skipped++;
    }
  }

  res.status(200).json({
    message: `Bulk upsert complete. ${inserted} inserted.`,
    updated,
    skipped,
  });
});



module.exports = router;