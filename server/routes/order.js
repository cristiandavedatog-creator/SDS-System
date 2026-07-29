const express = require('express');
const router = express.Router();
const db = require('../db'); // Assumes a database connection module is available
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const requireAuth = require('../middleware/auth');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'order'); // Directory to store uploaded PDF files
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
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

// GET all orders
router.get('/orders', (req, res) => {
  const sql = `
    SELECT 
      orders_table.idorder, 
      orders_table.name, 
      orders_table.address, 
      orders_table.position, 
      schools.name AS school_name,
      district.name AS district_name,
      orders_table.date_signed, 
      orders_table.pdf_path
    FROM 
      orders_table
    LEFT JOIN 
      schools ON orders_table.school = schools.school_id -- Join orders_table with schools

     LEFT JOIN
      district ON schools.district_id = district.id
    ORDER BY orders_table.idorder DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.status(200).json(results);
  });
});

// Same normalization used for PDF-extracted traveler names elsewhere in
// this app (travel.js, appointment.js) — strips suffixes/punctuation and
// folds a handful of OCR digit/letter confusions, so a name typed slightly
// differently (extra middle initial, "Jr." suffix, stray period) still
// matches the same employee record.
function normalizeEmployeeName(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/,?\s*(JR|SR|II|III|IV|CESO\s*[IVX]+)\.?$/i, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function matchingKey(name) {
  return normalizeEmployeeName(name)
    .replace(/1/g, 'I')
    .replace(/0/g, 'O')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B');
}

// Look up a person by name so Create Notice can auto-fill Address/
// Position/School/District instead of making the admin retype them for
// someone who already has data on file. Checks two sources and merges
// them (a previous Notice wins per-field when it has a value, since it's
// the more specific context; the Employee directory fills in whatever
// gaps are left — e.g. someone who's never had a notice before, or a
// notice that didn't record a School). Only ever used to PRE-fill blank
// fields client-side — never writes anything.
router.get('/orders/lookup', requireAuth, (req, res) => {
  const name = (req.query.name || '').trim();
  if (!name) return res.status(200).json({ found: false });

  const orderSql = `
    SELECT
      orders_table.address,
      orders_table.position,
      orders_table.school,
      schools.name AS school_name,
      schools.district_id,
      district.name AS district_name
    FROM orders_table
    LEFT JOIN schools ON orders_table.school = schools.school_id
    LEFT JOIN district ON schools.district_id = district.id
    WHERE LOWER(TRIM(orders_table.name)) = LOWER(TRIM(?))
    ORDER BY orders_table.idorder DESC
    LIMIT 1
  `;
  db.query(orderSql, [name], (err, orderRows) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    const orderMatch = orderRows[0] || null;

    db.query('SELECT fullname, office, positionTitle FROM employee', (empErr, employees) => {
      if (empErr) return res.status(500).json({ error: 'Database error.' });

      const target = matchingKey(name);
      const employeeMatch = employees.find((e) => matchingKey(e.fullname) === target) || null;

      if (!orderMatch && !employeeMatch) return res.status(200).json({ found: false });

      const finish = (schoolFromOffice) => {
        const school = orderMatch?.school
          ? { id: orderMatch.school, name: orderMatch.school_name, district_id: orderMatch.district_id, district_name: orderMatch.district_name }
          : schoolFromOffice;

        res.status(200).json({
          found: true,
          address: orderMatch?.address || '', // employees have no address on file
          position: orderMatch?.position || employeeMatch?.positionTitle || '',
          school: school || null,
        });
      };

      // The employee directory only has an "office" name (e.g. "Basud
      // National High School", or a central-office unit like "SGOD
      // Proper" that isn't a school at all) — resolve it against the
      // schools table to recover a district. Skipped entirely if a
      // Notice already supplied a school, or there's no employee match.
      if (!orderMatch?.school && employeeMatch?.office) {
        const schoolSql = `
          SELECT schools.school_id, schools.name, schools.district_id, district.name AS district_name
          FROM schools LEFT JOIN district ON schools.district_id = district.id
          WHERE LOWER(TRIM(schools.name)) = LOWER(TRIM(?))
          LIMIT 1
        `;
        db.query(schoolSql, [employeeMatch.office], (schoolErr, schoolRows) => {
          if (schoolErr || !schoolRows.length) return finish(null);
          const s = schoolRows[0];
          finish({ id: s.school_id, name: s.name, district_id: s.district_id, district_name: s.district_name });
        });
      } else {
        finish(null);
      }
    });
  });
});

// Create order (with optional PDF)
router.post('/orders', requireAuth, upload.single('pdf'), (req, res) => {
  const {
    name,
    address,
    position,
    school,
    date_signed,
  } = req.body;

  // Duplication check (no district in orders_table)
  const duplicateSql = `
    SELECT * FROM orders_table
    WHERE name = ? AND address = ? AND position = ? AND school = ?
  `;
  db.query(
    duplicateSql,
    [name, address, position, school],
    (dupErr, dupResults) => {
      if (dupErr) {
        return res.status(500).json({ error: dupErr.message || 'Database error during duplication check.' });
      }
      if (dupResults.length > 0) {
        // Return the actual error for frontend
        return res.status(409).json({ error: 'Duplicate order found with this name, address, position, and school.' });
      }

      // Proceed with order creation
      const formattedDateSigned = date_signed ? new Date(date_signed).toISOString().split('T')[0] : null;
      const pdfPath = req.file ? `uploads/order/${req.file.filename}` : null;
      const sql = `
        INSERT INTO orders_table
        (name, address, position, school, date_signed, pdf_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(
        sql,
        [name, address, position, school, formattedDateSigned, pdfPath],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message || 'Database insert error.' });
          }
          res.status(201).json({ message: 'Order created successfully!', id: result.insertId });
        }
      );
    }
  );
});

// EDIT order by ID (with optional PDF update)
router.put('/orders/:idorder', requireAuth, upload.single('pdf'), (req, res) => {
  const idorder = req.params.idorder;

  // Extract fields from request body
  const {
    name,
    address,
    position,
    school,
  
    date_signed,
  } = req.body;

  // Format dates to YYYY-MM-DD
  const formattedDateSigned = date_signed ? new Date(date_signed).toISOString().split('T')[0] : null;

  // Handle PDF upload path
  const pdfPath = req.file ? `uploads/order/${req.file.filename}` : null;

  // SQL query to update order details. Text fields are assigned directly
  // (not COALESCEd) so clearing a field in the edit form actually clears it
  // — only pdf_path falls back to the existing value, since a new file
  // isn't always attached on every edit.
  const sql = `
    UPDATE \`orders_table\`
    SET
      name = ?,
      address = ?,
      position = ?,
      school = ?,
      date_signed = ?,
      pdf_path = COALESCE(?, pdf_path)
    WHERE idorder = ?
  `;

  // Execute query with values
  db.query(
    sql,
    [
      name || null,
      address || null,
      position || null,
      school || null,
      formattedDateSigned,
      pdfPath || null,
      idorder,
    ],
    (err, result) => {
      if (err) {
        // Log SQL error for debugging
        console.error('Database error:', err.sqlMessage);
        return res.status(500).json({ error: 'Database error.', details: err.sqlMessage });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      res.status(200).json({ message: 'Order updated successfully!' });
    }
  );
});


// Delete order + delete PDF if exists
router.delete('/orders/:idorder', requireAuth, (req, res) => {
  const idorder = req.params.idorder;

  const getSql = 'SELECT pdf_path FROM `orders_table` WHERE idorder = ?';
  db.query(getSql, [idorder], (err, results) => {
    if (err) {
      console.error('Error fetching order:', err); // Log database error
      return res.status(500).json({ error: 'Error fetching order.' });
    }

    if (results.length === 0) {
      console.warn('Order not found for idorder:', idorder); // Log missing order
      return res.status(404).json({ error: 'Order not found.' });
    }

    const pdfPath = results[0].pdf_path;

    const deleteSql = 'DELETE FROM `orders_table` WHERE idorder = ?';
    db.query(deleteSql, [idorder], (err) => {
      if (err) {
        console.error('Error deleting order:', err); // Log database error
        return res.status(500).json({ error: 'Database error during delete.' });
      }

      if (pdfPath) {
        const fullPath = path.join(__dirname, '..', pdfPath);
        fs.unlink(fullPath, (fsErr) => {
          if (fsErr && fsErr.code !== 'ENOENT') {
            console.warn('PDF deletion error:', fsErr); // Log file deletion error
          }
        });
      }

      res.status(200).json({ message: 'Order and PDF deleted successfully!' });
    });
  });
});

module.exports = router;