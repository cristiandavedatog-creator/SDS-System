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
import { Save as SaveIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import axios from 'axios';
import AppShell from '../../Components/AppShell';
import { ADMIN_NOTICE_NAV_LINKS } from '../../config/navLinks';
import { startsWithFirstFilter } from '../../utils/autocompleteFilters';

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    position: '',
    district: '',
    school: '',
    date_signed: null,
  });
  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const baseURL = import.meta.env.VITE_API_URL;

useEffect(() => {
  const fetchDistricts = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/schools-w-district`);
      const data = response.data;

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

  // Fires once the admin finishes typing the Name (on blur, not every
  // keystroke, so this isn't hitting the API mid-type). If this person
  // already has data on file — either from a previous notice or from the
  // Employee directory — pre-fill Address/Position/School/District from
  // it, but only into fields that are still blank, so it never overwrites
  // something the admin already typed for a genuinely different entry
  // under a similar name.
  const handleNameBlur = async () => {
    const name = formData.name.trim();
    if (!name) return;
    try {
      const res = await axios.get(`${baseURL}/api/orders/lookup`, { params: { name } });
      if (!res.data.found) return;

      let filledAnything = false;
      setFormData((prev) => {
        if (prev.name.trim() !== name) return prev; // name changed again before this resolved
        const next = { ...prev };
        if (!next.address && res.data.address) { next.address = res.data.address; filledAnything = true; }
        if (!next.position && res.data.position) { next.position = res.data.position; filledAnything = true; }
        if (!next.school && res.data.school) {
          next.school = res.data.school;
          next.district = { id: res.data.school.district_id, name: res.data.school.district_name };
          filledAnything = true;
        }
        return next;
      });

      if (!filledAnything) return; // matched, but every field was already filled in by hand

      Swal.fire({
        icon: 'info',
        title: 'Existing record found',
        text: `Filled in what's on file for "${name}" (from a previous notice or the employee list). Review before submitting.`,
        timer: 3500,
        showConfirmButton: true,
      });
    } catch (err) {
      console.error('Name lookup failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      // axios (not fetch) so the app-wide Authorization header set at login
      // actually gets attached — this endpoint requires it.
      await axios.post(`${baseURL}/api/orders`, data);

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
    } catch (error) {
      if (error.response?.status === 409) {
        // Duplication error
        Swal.fire({
          icon: 'error',
          title: 'Duplicate Notice',
          text: error.response.data.error,
        });
        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response
          ? error.response.data?.error || 'Failed to create notice.'
          : 'An error occurred. Please try again.',
      });
    }
  };

  return (
    <AppShell title="Create Notice" navLinks={ADMIN_NOTICE_NAV_LINKS} showLogout>
      {/* Form */}
      <Box sx={{ width: '100%', maxWidth: 1400, margin: 'auto', padding: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={2} sx={{ padding: { xs: 3, sm: 4 }, width: '100%' }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Name Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  required
                />
              </Grid>

              {/* Address Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
    sx={{ minWidth: 223 }}
    disablePortal
    options={schools}
    getOptionLabel={(option) => option.name}
    filterOptions={startsWithFirstFilter((option) => option.name)}
    value={formData.school || null} // Ensure value is null if no school is selected
    onChange={handleSchoolChange} // Use the updated function
    renderInput={(params) => (
      <TextField {...params} label="School/Office" required />
    )}
  />
              </Grid>

               {/* District Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ width: '223px' }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date Signed"
                      value={formData.date_signed}
                      onChange={(newValue) =>
                        handleDateChange('date_signed', newValue)
                      }
                      slotProps={{ textField: { required: true } }}
                    />
                  </LocalizationProvider>
                </Box>
              </Grid>

              {/* Upload PDF Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                  Upload PDF
                  <input
                    type="file"
                    name='pdf'
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      setPdfFile(e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </Button>

                {pdfFile && (
    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
      Selected file: {pdfFile.name}
    </Typography>
  )}
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box mt={3}>
              <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} fullWidth>
                Submit
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </AppShell>
  );
};

export default CreateOrder;