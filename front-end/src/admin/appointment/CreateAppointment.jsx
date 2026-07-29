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
  Paper,
} from '@mui/material';
import { Save as SaveIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import axios from 'axios';
import BulkAppointmentUpload from '../AdminComponents/BulkAppointment';
import AppShell from '../../Components/AppShell';
import Swal from 'sweetalert2'; // Import SweetAlert2
import { ADMIN_APPOINTMENT_NAV_LINKS } from '../../config/navLinks';

// Labels for the auto-fill summary shown after reading an uploaded PDF —
// covers every required field, not just the ones the extractor attempts,
// so District/Date Signed (never present as printed text on the form) are
// always called out as needing manual entry too.
const FIELD_LABELS = {
  name: 'Name',
  positionTitle: 'Position Title',
  schoolOffice: 'School/Office',
  district: 'District',
  statusOfAppointment: 'Status of Appointment',
  natureAppointment: 'Nature of Appointment',
  itemNo: 'Item No.',
  dateSigned: 'Date Signed',
};

// Remarks is worth announcing when the PDF happens to have some (e.g. "on
// maternity leave"), but the form doesn't require it — it should never show
// up in the "please fill in manually" list just because it's usually blank.
const OPTIONAL_FIELD_LABELS = {
  remarks: 'Remarks',
};

const ALL_FIELD_LABELS = { ...FIELD_LABELS, ...OPTIONAL_FIELD_LABELS };

const CreateAppointment = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
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
    const { name, value } = e.target;
    // Remarks is free text, not a code/title field, so it's left as typed (matches EditAppointment's handling).
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'remarks' ? value : value.toUpperCase(),
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

const todayISO = () => new Date().toISOString().slice(0, 10);

// Reads the just-selected PDF and auto-fills whatever fields it can find —
// the backend tries the PDF's own text layer first, then falls back to OCR
// for scanned images. Best-effort only: fields it can't confidently read
// (or every field, if even OCR comes up empty) are left exactly as they
// are, and the admin is told which ones still need manual entry — this
// never blocks or auto-submits anything on its own.
const handlePdfSelect = async (file) => {
  setPdfFile(file);
  // Date Signed is hand-signed on the actual form, never printed text, so
  // there's nothing to extract for it — default it to today (the upload
  // date) instead, without touching it if the admin already typed one.
  setFormData((prev) => (prev.dateSigned ? prev : { ...prev, dateSigned: todayISO() }));
  setExtracting(true);
  try {
    const extractData = new FormData();
    extractData.append('pdf', file);
    const res = await axios.post(`${baseURL}/api/appointment/extract-pdf`, extractData);
    const { hasText, fields } = res.data;

    if (!hasText) {
      Swal.fire({
        icon: 'info',
        title: "Couldn't read this PDF",
        text: "Couldn't extract any readable text from this file, even with OCR — please fill in the details manually.",
      });
      return;
    }

    setFormData((prev) => {
      const next = { ...prev };
      const filled = [];
      Object.entries(fields).forEach(([key, value]) => {
        // Never overwrite something the admin already typed.
        if (value && !prev[key]) {
          next[key] = value;
          filled.push(ALL_FIELD_LABELS[key]);
        }
      });

      const stillBlank = Object.keys(FIELD_LABELS).filter((key) => !next[key]);

      Swal.fire({
        icon: filled.length ? 'success' : 'warning',
        title: filled.length ? 'Auto-filled from PDF' : "Couldn't find any details",
        html: [
          filled.length ? `<b>Filled in:</b> ${filled.join(', ')}` : '',
          stillBlank.length ? `<b>Please fill in manually:</b> ${stillBlank.map((key) => FIELD_LABELS[key]).join(', ')}` : '',
        ].filter(Boolean).join('<br/>'),
      });

      return next;
    });
  } catch (err) {
    console.error('PDF extraction failed:', err);
    Swal.fire({
      icon: 'warning',
      title: 'Auto-fill unavailable',
      text: 'Could not read this PDF automatically. Please fill in the details manually.',
    });
  } finally {
    setExtracting(false);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();

  // Run validation before submitting
  if (!validateForm()) {
    return; // Stop submission if validation fails
  }

  try {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (pdfFile) {
      data.append('pdf', pdfFile);
    }

    await axios.post(`${baseURL}/api/appointment`, data, {
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
    <AppShell title="Create Appointment" navLinks={ADMIN_APPOINTMENT_NAV_LINKS} showLogout>
      <Box sx={{ width: '100%', maxWidth: 1400, margin: 'auto', padding: { xs: 2, sm: 4 } }}>
        <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Name Field */}
              <Grid size={12}>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>

              {/* Position Title and Status of Appointment */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Position Title"
                  name="positionTitle"
                  value={formData.positionTitle}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="School/Office"
                  name="schoolOffice"
                  value={formData.schoolOffice}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                />
              </Grid>

              {/* Nature of Appointment */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Item No."
                  name="itemNo"
                  value={formData.itemNo}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Date Signed"
                  name="dateSigned"
                  type="date"
                  value={formData.dateSigned}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* PDF Upload — auto-fills whatever fields it can read from the PDF */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                  disabled={extracting}
                >
                  {extracting ? 'Reading PDF…' : 'Upload PDF'}
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    disabled={extracting}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      e.target.value = '';
                      if (file) handlePdfSelect(file);
                    }}
                  />
                </Button>

                {pdfFile && (
                  <Typography
                    variant="body2"
                    mt={1}
                    sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {pdfFile.name}
                  </Typography>
                )}
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} fullWidth>
                Submit
              </Button>
            </Box>
          </form>

          <Box
            sx={{
              mt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
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
        </Paper>
      </Box>
    </AppShell>
  );
};

export default CreateAppointment;