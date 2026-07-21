import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import BulkAppointmentUpload from '../AdminComponents/BulkAppointment';
import Header from '../../Components/Header';
import Swal from 'sweetalert2'; // Import SweetAlert2

const navLinks = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Appointments', path: '/editAppointment' },
  { label: 'Add Appointments', path: '/createAppointment' },
];

const CreateAppointment = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    positionTitle: '',
    schoolOffice: '',
    district: '',
    statusOfAppointment: '',
    natureAppointment: '',
    itemNo: '',
    dateSigned: '',
    remarks: '',
  });
  const baseURL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    const upperCaseValue = e.target.value.toUpperCase(); // Convert input to uppercase
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: upperCaseValue, // Update state with uppercase value
    }));
  };

  const validateForm = () => {
    // Validation rules for each field
    if (!formData.name) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Name is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.positionTitle) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Position Title is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.statusOfAppointment) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Status of Appointment is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.schoolOffice) {
      Swal.fire({
        title: 'Validation Error',
        text: 'School/Office is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.district) {
      Swal.fire({
        title: 'Validation Error',
        text: 'District is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.natureAppointment) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Nature of Appointment is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.itemNo) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Item No. is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    if (!formData.dateSigned) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Date Signed is required.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }

    

    return true; // All validations passed
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Run validation before submitting
  if (!validateForm()) {
    return; // Stop submission if validation fails
  }

  console.log('Form Data:', formData); // Log the form data

  try {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (pdfFile) {
      data.append('pdf', pdfFile);
    }

    const response = await axios.post(`${baseURL}/api/appointment`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Show success alert using Swal
    Swal.fire({
      title: 'Success!',
      text: 'Appointment submitted successfully!',
      icon: 'success',
      confirmButtonText: 'OK',
    });

    // Reset form after successful submission
    setFormData({
      name: '',
      positionTitle: '',
      schoolOffice: '',
      district: '',
      statusOfAppointment: '',
      natureAppointment: '',
      itemNo: '',
      dateSigned: '',
      remarks: '',
    });
    setPdfFile(null);
  } catch (error) {
    console.error('Error submitting data:', error); // Log the error

    // Check for duplicate entry error (status 400)
    if (error.response && error.response.status === 400) {
      Swal.fire({
        title: 'Duplicate Entry',
        text: error.response.data.message || 'An appointment with this Name or Item No. already exists.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } else {
      // Show generic error alert for other errors
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.error || 'Failed to submit data. Please try again.',
        icon: 'error',
        confirmButtonText: 'Retry',
      });
    }
  }
};

  return (
    <Box>
      {/* Header with Navbar */}
      <Header title="Admin Appointments" navLinks={navLinks} showLogout />

      <Box sx={{ maxWidth: 855, margin: 'auto', padding: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add Appointment
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Name Field */}
            <Grid item xs={12}>
              <TextField
                sx={{ minWidth: 250 }}
                required
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            {/* Position Title and Status of Appointment */}
            <Grid item xs={6}>
              <TextField
                sx={{ minWidth: 250 }}
                fullWidth
                label="Position Title"
                name="positionTitle"
                value={formData.positionTitle}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ minWidth: 250 }}>
                <InputLabel>STATUS OF APPOINTMENT</InputLabel>
                <Select
                  name="statusOfAppointment"
                  value={formData.statusOfAppointment}
                  onChange={handleChange}
                >
                  <MenuItem value="PERMANENT">PERMANENT</MenuItem>
                  <MenuItem value="TEMPORARY">TEMPORARY</MenuItem>
                  <MenuItem value="PROVISIONAL">PROVISIONAL</MenuItem>
                  <MenuItem value="SUBSTITUTE">SUBSTITUTE</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* School/Office and District */}
            <Grid item xs={6}>
              <TextField
                sx={{ minWidth: 250 }}
                fullWidth
                label="School/Office"
                name="schoolOffice"
                value={formData.schoolOffice}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ minWidth: 250 }}
                fullWidth
                label="District"
                name="district"
                value={formData.district}
                onChange={handleChange}
              />
            </Grid>

            {/* Nature of Appointment */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ minWidth: 250 }}>
                <InputLabel>NATURE OF APPOINTMENT</InputLabel>
                <Select
                  name="natureAppointment"
                  value={formData.natureAppointment}
                  onChange={handleChange}
                >
                 
                  <MenuItem value="ORIGINAL">ORIGINAL</MenuItem>
                  <MenuItem value="PROMOTION">PROMOTION</MenuItem>
                  <MenuItem value="RECLASSIFICATION">RECLASSIFICATION</MenuItem>
                  <MenuItem value="REAPPOINTMENT">REAPPOINTMENT</MenuItem>
                  
                  <MenuItem value="REEMPLOYMENT">REEMPLOYMENT</MenuItem>
                  <MenuItem value="TRANSFER">TRANSFER</MenuItem>
                   <MenuItem value="DEMOTION">DEMOTION</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Item No. and Date Signed */}
            <Grid item xs={6}>
              <TextField
                sx={{ minWidth: 250 }}
                fullWidth
                label="Item No."
                name="itemNo"
                value={formData.itemNo}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ minWidth: 250 }}
                fullWidth
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ minWidth: 250 }}
                fullWidth
                label="Date Signed"
                name="dateSigned"
                type="date"
                value={formData.dateSigned}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* PDF Upload */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                sx={{ minWidth: 250, maxWidth: 400, width: '100%' }}
                fullWidth
              >
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
              </Button>

              {pdfFile && (
                <Typography
                  variant="body2"
                  mt={1}
                  sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {pdfFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
          <Box mt={3}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Submit
            </Button>
          </Box>
        </form>

        <Box
          sx={{
            mt: 4,
            borderTop: '1px solid #ccc',
            pt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Bulk Insertion and Update
          </Typography>
          <BulkAppointmentUpload />
        </Box>
      </Box>
    </Box>
  );
};

export default CreateAppointment;