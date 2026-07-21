import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Autocomplete } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import Header from '../../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Notices', path: '/editOrder' },
  { label: 'Create Notice', path: '/createOrder' },
];

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    position: '',
    district: '',
    school: '',
    dateSigned: null,
  });
  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const baseURL = import.meta.env.VITE_API_URL;

useEffect(() => {
  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${baseURL}/api/schools-w-district`);
      const data = await response.json();

      // Set schools with district information
      setSchools(
        data.map((item) => ({
          id: item.school_id,
          name: item.school_name,
          district_id: item.district_id,
          district_name: item.district_name,
        }))
      );

      // Set unique districts
      const uniqueDistricts = Array.from(
        new Map(
          data.map((item) => [item.district_id, { id: item.district_id, name: item.district_name }])
        ).values()
      );
      setDistricts(uniqueDistricts);
    } catch (error) {
      console.error('Failed to fetch schools and districts:', error);
    }
  };

  fetchDistricts();
}, []);

const handleSchoolChange = (event, newValue) => {
  if (newValue) {
    // Autofill the district based on the selected school
    setFormData((prev) => ({
      ...prev,
      school: newValue,
      district: { id: newValue.district_id, name: newValue.district_name },
    }));
  } else {
    // Reset the school and district if no school is selected
    setFormData((prev) => ({
      ...prev,
      school: '',
      district: '',
    }));
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);

    // Create FormData object to handle file and other form data
    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address);
    data.append('position', formData.position);
    data.append('school', formData.school?.id || ''); // Send school name
    data.append('district', formData.district?.id || ''); // Send only the district ID
   data.append('date_signed', formData.date_signed ? dayjs(formData.date_signed).format('YYYY-MM-DD') : '');  // Format date_signed
    if (pdfFile) {
      data.append('pdf', pdfFile);
    } else {
      data.append('pdf', null); // Ensure pdf field is sent even if no file is selected
    }

    try {
      const response = await fetch(`${baseURL}/api/orders`, {
        method: 'POST',
        body: data,
      });

      if (response.status === 409) {
        // Duplication error
        const result = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Duplicate Notice',
          text: result.error,
        });
        return;
      }

      if (response.ok) {
        const result = await response.json();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Notice created successfully!',
        });
        // Reset form fields
        setFormData({
          name: '',
          address: '',
          position: '',
          district: '',
          school: '',
          date_signed: null,
        });
        setPdfFile(null);
      } else {
        // Show actual error from backend if available
        const result = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Failed to create notice.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred. Please try again.',
      });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Header title="Admin - Create Notice" navLinks={navLinks} showLogout />

      {/* Form */}
      <Box sx={{ maxWidth: 830, margin: 'auto', padding: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h5" gutterBottom>
            Create Notice
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Name Field */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              {/* Address Field */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Grid>

              {/* Position Field */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                />
              </Grid>

             

              {/* School Field */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
    sx={{ minWidth: 223 }}
    disablePortal
    options={schools}
    getOptionLabel={(option) => option.name}
    value={formData.school || null} // Ensure value is null if no school is selected
    onChange={handleSchoolChange} // Use the updated function
    renderInput={(params) => (
      <TextField {...params} label="School/Office" required />
    )}
  />
              </Grid>

               {/* District Field */}
              <Grid item xs={12} sm={6}>
              <Autocomplete
  sx={{ minWidth: 223 }}
  disablePortal
  options={districts}
  getOptionLabel={(option) => option.name || ''}
  value={formData.district || null}
  onChange={(event, newValue) =>
    setFormData((prev) => ({
      ...prev,
      district: newValue,
    }))
  }
  renderInput={(params) => (
    <TextField {...params} label="District" required />
  )}
/>
              </Grid> 

          

              {/* Date Signed Field */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ width: '223px' }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date Signed"
                      value={formData.date_signed}
                      onChange={(newValue) =>
                        handleDateChange('date_signed', newValue)
                      }
                      renderInput={(params) => <TextField {...params} required />}
                    />
                  </LocalizationProvider>
                </Box>
              </Grid>

              {/* Upload PDF Field */}
              <Grid item xs={12} sm={6}>
                <Button variant="outlined" component="label">
                  Upload PDF
                  <input
                    type="file"
                    name='pdf'
                    accept="application/pdf"
                    hidden
                    onChange={(e) => setPdfFile(e.target.files[0])}
                  />
                </Button>

                {pdfFile && (
    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'gray' }}>
      Selected file: {pdfFile.name}
    </Typography>
  )}
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box mt={3}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Submit
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default CreateOrder;