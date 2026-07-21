const express = require('express');
const db = require('../db');
const router = express.Router();
const requireAuth = require('../middleware/auth');



// Validation Function
const validateEmployeeData = (data) => {
  const requiredFields = ['fullName', 'office', 'positionTitle', 'initial'];
  for (const field of requiredFields) {
    if (typeof data[field] !== 'string' || data[field].trim() === '') {
      return { valid: false, field };
    }
  }
  return { valid: true };
};


router.get('/employees', (req, res) => {
  const sql = 'SELECT * FROM `employee`';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.status(200).json(results);
  });
});

/* =====================================================
   GET EMPLOYEE BY ID
   ===================================================== */
router.get('/employees/:id', (req, res) => {
  const { id } = req.params;
  if (isNaN(Number(id))) return res.status(400).json({ error: 'Invalid ID format' });

  const sql = `SELECT * FROM employee WHERE uid = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (result.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json(result[0]);
  });
});

/* =====================================================
   CREATE EMPLOYEE
   ===================================================== */
router.post('/employees', requireAuth, (req, res) => {
  const { fullName, office, positionTitle, initial } = req.body;
  const employeeData = { fullName, office, positionTitle, initial };

  const validation = validateEmployeeData(employeeData);
  if (!validation.valid) {
    return res.status(400).json({ error: `Missing or invalid ${validation.field}` });
  }

  const duplicateCheckSQL = `SELECT * FROM employee WHERE fullName = ? OR Initial = ?`;
  db.query(duplicateCheckSQL, [fullName, initial], (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (results.length > 0) {
      return res
        .status(400)
        .json({ error: 'Employee with this name or initial already exists' });
    }

    const sql = `INSERT INTO employee (fullName, office, positionTitle, Initial) VALUES (?, ?, ?, ?)`;
    db.query(sql, [fullName, office, positionTitle, initial], (err, result) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      res.status(201).json({ message: 'Employee created successfully', id: result.insertId });
    });
  });
});

/* =====================================================
   BULK CREATE EMPLOYEES
   ===================================================== */
router.post('/employees/bulk', requireAuth, (req, res) => {
  const employees = req.body;
  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'Invalid input: Array of employees required' });
  }

  const validatedEmployees = [];
  for (let i = 0; i < employees.length; i++) {
    const validation = validateEmployeeData(employees[i]);
    if (!validation.valid) {
      return res.status(400).json({ error: `Missing or invalid ${validation.field} for employee at index ${i}` });
    }
    validatedEmployees.push([
      employees[i].fullName,
      employees[i].office,
      employees[i].positionTitle,
      employees[i].initial
    ]);
  }

  const sql = `INSERT INTO employee (fullName, office, positionTitle, Initial) VALUES ?`;
  db.query(sql, [validatedEmployees], (err, result) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    res.status(201).json({
      message: 'Employees created successfully',
      affectedRows: result.affectedRows,
      insertIds: Array.from({ length: result.affectedRows }, (_, i) => result.insertId + i)
    });
  });
});

/* =====================================================
   UPDATE EMPLOYEE
   ===================================================== */
router.put('/employees/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  if (isNaN(Number(id))) return res.status(400).json({ error: 'Invalid ID format' });

  const { fullName, office, positionTitle, initial } = req.body;
  const employeeData = { fullName, office, positionTitle, initial };

  const validation = validateEmployeeData(employeeData);
  if (!validation.valid) {
    return res.status(400).json({ error: `Missing or invalid ${validation.field}` });
  }

  const duplicateCheckSQL = `SELECT * FROM employee WHERE (fullName = ? OR Initial = ?) AND uid != ?`;
  db.query(duplicateCheckSQL, [fullName, initial, id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (results.length > 0) {
      return res
        .status(400)
        .json({ error: 'Employee with this name or initial already exists' });
    }

    const sql = `UPDATE employee SET fullName = ?, office = ?, positionTitle = ?, Initial = ? WHERE uid = ?`;
    db.query(sql, [fullName, office, positionTitle, initial, id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
      res.status(200).json({ message: 'Employee updated successfully' });
    });
  });
});

/* =====================================================
   DELETE EMPLOYEE
   ===================================================== */
router.delete('/employees/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  if (isNaN(Number(id))) return res.status(400).json({ error: 'Invalid ID format' });

  const sql = `DELETE FROM employee WHERE uid = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json({ message: 'Employee deleted successfully' });
  });
});

module.exports = router;
