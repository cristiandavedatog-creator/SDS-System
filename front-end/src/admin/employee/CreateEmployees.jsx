import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Grid, Typography, Paper,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Box, CircularProgress, IconButton, InputAdornment, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import AppShell from '../../Components/AppShell';
import { ADMIN_EMPLOYEE_NAV_LINKS } from '../../config/navLinks';
import EmptyState from '../../Components/reusable_components/EmptyState';
import TableSkeleton from '../../Components/reusable_components/TableSkeleton';

const showSwal = (options) => {
  return Swal.fire({
    ...options,
    didOpen: () => {
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '2000'; // MUI Dialog is 1300, this ensures Swal is above
      }
    }
  });
};

// Exported separately so the admin dashboard can render this content inline
// (inside its container-transform overlay) without a nested AppShell. All
// state/logic/data-fetching below is unchanged from the original component.
export const CreateEmployeeContent = () => {
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
  const [initialLoading, setInitialLoading] = useState(true);
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
    } finally {
      setInitialLoading(false);
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
    const result = await showSwal({
      title: 'Are you sure?',
      text: 'This also permanently deletes every travel record linked to this employee. You won’t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });
    if (!result.isConfirmed) return;

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
    <>
      {/* Employee List and Add Button */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: 1400, margin: '20px auto' }}>
        <Typography variant="h6" gutterBottom>
          Employee List
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreateModal} sx={{ marginBottom: 2, whiteSpace: 'nowrap' }}>
          Add New Employee
        </Button>

        </Box>
       
        <TableContainer component={Box} sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3 }}>Full Name</TableCell>
                <TableCell>Office</TableCell>
                <TableCell>Position Title</TableCell>
                <TableCell>Initial</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading ? (
                <TableSkeleton columns={5} />
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.uid}>
                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }}>{employee.fullname}</TableCell>
                    <TableCell>{employee.office}</TableCell>
                    <TableCell>{employee.positionTitle}</TableCell>
                    <TableCell>{employee.Initial}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditModal(employee)}
                            disabled={loading}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(employee.uid)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : !initialLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <EmptyState message="No employees found" hint="Try a different search term." />
                  </TableCell>
                </TableRow>
              ) : null}
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
              <Grid size={12}>
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Office"
                  name="office"
                  value={formData.office}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Position Title"
                  name="positionTitle"
                  value={formData.positionTitle}
                  onChange={handleInputChange}
                  fullWidth required
                />
              </Grid>
              <Grid size={12}>
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
          <Button form="employee-form" type="submit" variant="contained" color="primary" startIcon={!loading && <SaveIcon />} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Employee' : 'Create Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload */}
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: 1400, margin: '20px auto' }}>
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
          startIcon={!loading && <UploadFileIcon />}
          onClick={handleFileUpload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
        {message && (
          <Typography
            variant="body1"
            color={message.includes('Error') || message.includes('failed') ? 'error' : 'primary'}
            sx={{ mt: 1.5 }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </>
  );
};

const CreateEmployee = () => (
  <AppShell title="Employee" navLinks={ADMIN_EMPLOYEE_NAV_LINKS} showLogout>
    <CreateEmployeeContent />
  </AppShell>
);

export default CreateEmployee;