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
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.status(200).json(results);
  });
});

// Create order (with optional PDF)
router.post('/orders', requireAuth, upload.single('pdf'), (req, res) => {
  console.log('Request Body:', req.body);
  console.log('Uploaded File:', req.file);

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

  // Log incoming data for debugging
  console.log('Incoming data:', {
    idorder,
    name,
    address,
    position,
    school,

    date_signed: formattedDateSigned, // Log formatted date
    file: req.file ? req.file.filename : null,
  });

  // SQL query to update order details
  const sql = `
    UPDATE \`orders_table\`
    SET 
      name = COALESCE(?, name),
      address = COALESCE(?, address),
      position = COALESCE(?, position),
      school = COALESCE(?, school),
  
      date_signed = COALESCE(?, date_signed),
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

      formattedDateSigned || null, // Use the formatted date
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

  console.log('Delete request received for idorder:', idorder); // Log incoming ID

  const getSql = 'SELECT pdf_path FROM `orders_table` WHERE idorder = ?';
  db.query(getSql, [idorder], (err, results) => {
    if (err) {
      console.error('Error fetching order:', err); // Log database error
      return res.status(500).json({ error: 'Error fetching order.' });
    }

    console.log('Fetch results:', results); // Log query results

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

      console.log('Order deleted successfully'); // Log successful deletion

      if (pdfPath) {
        const fullPath = path.join(__dirname, '..', pdfPath);
        console.log('Attempting to delete file at path:', fullPath); // Log file path
        fs.unlink(fullPath, (fsErr) => {
          if (fsErr && fsErr.code !== 'ENOENT') {
            console.warn('PDF deletion error:', fsErr); // Log file deletion error
          } else {
            console.log('PDF deleted successfully or file not found.'); // Log successful file deletion
          }
        });
      }

      res.status(200).json({ message: 'Order and PDF deleted successfully!' });
    });
  });
});

module.exports = router;