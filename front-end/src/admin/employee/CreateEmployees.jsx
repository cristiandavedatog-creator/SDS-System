import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Grid, Typography, Paper,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import Header from '../../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Employees', path: '/employees' },
];
const showSwal = (options) => {
  Swal.fire({
    ...options,
    didOpen: () => {
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '2000'; // MUI Dialog is 1300, this ensures Swal is above
      }
    }
  });
};

const CreateEmployee = () => {
  const [formData, setFormData] = useState({
    uid: null,
    fullName: '',
    office: '',
    positionTitle: '',
    initial: '',
  });
  const [message, setMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const baseURL = import.meta.env.VITE_API_URL;

  const handleOpenCreateModal = () => {
    setFormData({ uid: null, fullName: '', office: '', positionTitle: '', initial: '' });
    setIsEditing(false);
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (employee) => {
    setFormData({
      uid: employee.uid,
      fullName: employee.fullname,
      office: employee.office,
      positionTitle: employee.positionTitle,
      initial: employee.Initial,
    });
    setIsEditing(true);
    setOpenFormModal(true);
  };

  const handleCloseModal = () => setOpenFormModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'initial' ? value.toUpperCase() : value,
    });
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/employees`);
      setEmployees(response.data);
    } catch (error) {
      setMessage(`Error fetching employees: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const existingEmployee = employees.find(
        (emp) =>
          emp.uid !== formData.uid && // Exclude the current employee being edited
          (emp.fullname.toLowerCase() === formData.fullName.toLowerCase() ||
            emp.Initial.toLowerCase() === formData.initial.toLowerCase())
      );

      if (existingEmployee) {
        showSwal({
          icon: 'error',
          title: 'Validation Error',
          text:
            existingEmployee.fullname.toLowerCase() === formData.fullName.toLowerCase()
              ? 'Employee with this name already exists.'
              : 'Employee with this initial already exists.',
        });
        setLoading(false);
        return;
      }

      if (isEditing) {
        const response = await axios.put(`${baseURL}/api/employees/${formData.uid}`, formData);
        showSwal({
          icon: 'success',
          title: 'Success',
          text: response.data.message,
        });
      } else {
        const response = await axios.post(`${baseURL}/api/employees`, formData);
        showSwal({
          icon: 'success',
          title: 'Success',
          text: response.data.message,
        });
      }

      setFormData({ uid: null, fullName: '', office: '', positionTitle: '', initial: '' });
      setIsEditing(false);
      fetchEmployees();
      handleCloseModal();
    } catch (error) {
      showSwal({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${baseURL}/api/employees/${uid}`);
      showSwal({
        icon: 'success',
        title: 'Deleted',
        text: response.data.message,
      });
      fetchEmployees();
    } catch (error) {
      showSwal({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ uid: null, fullName: '', office: '', positionTitle: '', initial: '' });
    setIsEditing(false);
    handleCloseModal();
  };

  const validateEmployee = (employee) => {
    const requiredFields = ['fullName', 'office', 'positionTitle', 'initial'];
    for (const field of requiredFields) {
      if (!employee[field] || typeof employee[field] !== 'string' || employee[field].trim() === '') {
        return { valid: false, field, rowIndex: employee.rowIndex };
      }
    }
    return { valid: true };
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage('Please choose an Excel file first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const employeesData = jsonData
          .map((row, index) => ({
            fullName: (row['Full Name'] || '').trim(),
            office: (row['Office'] || '').trim(),
            positionTitle: (row['Position Title'] || '').trim(),
            initial: (row['Initial'] || '').trim(),
            rowIndex: index + 2,
          }))
          .filter(row => validateEmployee(row).valid);

        if (employeesData.length === 0) {
          setMessage('No valid employee data found in the Excel file.');
          setLoading(false);
          return;
        }

        try {
          const response = await axios.post(`${baseURL}/api/employees/bulk`, employeesData, {
            headers: { 'Content-Type': 'application/json' },
          });
          setMessage(`${response.data.message} (${response.data.affectedRows} employees added)`);
          setFile(null);
          fetchEmployees();
        } catch (error) {
          setMessage(`Bulk upload failed: ${error.response?.data?.error || error.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setMessage(`Error processing file: ${error.message}`);
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.fullname.toLowerCase().includes(searchQuery) ||
    employee.office.toLowerCase().includes(searchQuery) ||
    employee.positionTitle.toLowerCase().includes(searchQuery) ||
    employee.Initial.toLowerCase().includes(searchQuery)
  );

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <Box>
      {/* Navbar */}
      <Header title="Employee" navLinks={navLinks} showLogout />

      {/* Employee List and Add Button */}
      <Paper style={{ padding: 20, maxWidth: 800, margin: '20px auto' }}>
         <Typography variant="h5" gutterBottom>
          Employee List
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleOpenCreateModal} sx={{ marginBottom: 2 }}>
          Add New Employee
        </Button>

        </Box>
       
        <TableContainer component={Box} sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Office</TableCell>
                <TableCell>Position Title</TableCell>
                <TableCell>Initial</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.uid}>
                    <TableCell>{employee.fullname}</TableCell>
                    <TableCell>{employee.office}</TableCell>
                    <TableCell>{employee.positionTitle}</TableCell>
                    <TableCell>{employee.Initial}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleOpenEditModal(employee)}
                        style={{ marginRight: 8 }}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleDelete(employee.uid)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No employees found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal Form */}
      <Dialog open={openFormModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Employee' : 'Create New Employee'}</DialogTitle>
        <DialogContent>
          {message && (
            <Typography
              variant="body1"
              color={message.includes('Error') ? 'error' : 'primary'}
              gutterBottom
            >
              {message}
            </Typography>
          )}
          <form id="employee-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Office"
                  name="office"
                  value={formData.office}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Position Title"
                  name="positionTitle"
                  value={formData.positionTitle}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Initial"
                  name="initial"
                  value={formData.initial}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} disabled={loading}>Cancel</Button>
          <Button form="employee-form" type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Employee' : 'Create Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload */}
      <Box style={{ padding: 20, maxWidth: 800, margin: '20px auto' }}>
        <Typography variant="h6" gutterBottom>
          Bulk Upload via Excel
        </Typography>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: 10 }}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleFileUpload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateEmployee;