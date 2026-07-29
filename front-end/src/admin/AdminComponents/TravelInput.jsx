import React, { useState, useEffect } from 'react';
import {  TextField,  Autocomplete,  Button,  Box,  FormControl,  InputLabel,  MenuItem,  Select,  IconButton, Dialog,  DialogTitle,  DialogContent,  DialogActions,  Typography,  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Import Delete Icon
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import Swal from 'sweetalert2';

const TravelInput = () => {
  const [travelers, setTravelers] = useState([
    { uid: '', name: '', position: '', station: '', initial: '' },
  ]);
  const [inclusiveDate, setInclusiveDate] = useState(null);
  const [exclusiveDate, setExclusiveDate] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [host, setHost] = useState('');
  const [destination, setDestination] = useState('');
  const [area, setArea] = useState('');
  const [employees, setEmployees] = useState([]);
  const [autocompleteValue, setAutocompleteValue] = useState(null);
  const [file, setFile] = useState(null);
  const [sourceOfFund, setSourceOfFund] = useState("Local Fund");
  const [extracting, setExtracting] = useState(false);
  const baseURL = import.meta.env.VITE_API_URL;

  const FIELD_LABELS = {
    purpose: 'Purpose of Travel',
    host: 'Host of Activity',
    datesFrom: 'Inclusive Date (From)',
    datesTo: 'Inclusive Date (To)',
    destination: 'Destination',
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/employees`);
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, []);

// Reads the just-selected PDF and auto-fills whatever fields it can find,
// including the traveler list — the backend matches each name the PDF
// lists against the employee database and returns their actual
// Position/Station from that record, which is far more reliable than
// anything printed on the form itself (often just "As stated above").
// Best-effort only: fields it can't confidently read are left exactly as
// they are, and the admin is told which ones still need manual entry —
// this never blocks or auto-submits anything on its own.
const handlePdfSelect = async (selectedFile) => {
  setFile(selectedFile);
  setExtracting(true);
  try {
    const extractData = new FormData();
    extractData.append('pdf', selectedFile);
    const res = await axios.post(`${baseURL}/api/travels/extract-pdf`, extractData);
    const { hasText, fields } = res.data;

    if (!hasText) {
      Swal.fire({
        icon: 'info',
        title: "Couldn't read this PDF",
        text: "Couldn't extract any readable text from this file, even with OCR — please fill in the details manually.",
      });
      return;
    }

    const filled = [];
    let travelerNote = '';

    // Only replace the traveler list if it's still in its untouched
    // starting state (one blank row) — if the admin already picked or
    // typed someone in, add to it instead of wiping their work out.
    if (fields.travelers && fields.travelers.length > 0) {
      const isPristine = travelers.length === 1 && !travelers[0].uid && !travelers[0].name;
      const newEntries = fields.travelers.map((t) => ({
        uid: t.uid || '',
        name: t.name || '',
        position: t.position || '',
        station: t.station || '',
        initial: t.initial || '',
      }));
      setTravelers(isPristine ? newEntries : [...travelers, ...newEntries]);

      const matchedCount = fields.travelers.filter((t) => t.matched).length;
      const unmatchedCount = fields.travelers.length - matchedCount;
      const travelerWord = fields.travelers.length > 1 ? 'travelers' : 'traveler';
      if (matchedCount > 0) {
        travelerNote = `${matchedCount} ${travelerWord} matched to existing employee records`;
        if (unmatchedCount > 0) travelerNote += ` (${unmatchedCount} not found — please search for ${unmatchedCount > 1 ? 'them' : 'that one'} manually)`;
      } else {
        travelerNote = `Found ${fields.travelers.length} name${fields.travelers.length > 1 ? 's' : ''} in the PDF, but none matched an existing employee record — please search manually`;
      }
    }

    // Never overwrite something the admin already typed.
    if (fields.purpose && !purpose.trim()) {
      setPurpose(fields.purpose);
      filled.push(FIELD_LABELS.purpose);
    }
    if (fields.host && !host.trim()) {
      setHost(fields.host);
      filled.push(FIELD_LABELS.host);
    }
    if (fields.destination && !destination.trim()) {
      setDestination(fields.destination);
      filled.push(FIELD_LABELS.destination);
    }

    // Source of Fund is intentionally not read from the PDF — this office
    // only ever uses Local Fund, so the field is fixed and never varies.

    if (fields.datesFrom && !inclusiveDate) {
      setInclusiveDate(dayjs(fields.datesFrom));
      filled.push(FIELD_LABELS.datesFrom);
    }
    if (fields.datesTo && !exclusiveDate) {
      setExclusiveDate(dayjs(fields.datesTo));
      filled.push(FIELD_LABELS.datesTo);
    }

    // Checked against actual current state (not just "did this extraction
    // just fill it"), so a field the admin already typed in before
    // uploading correctly doesn't get flagged as still needing attention.
    // Source of Fund is excluded — it's fixed to "Local Fund", never blank.
    const stillBlank = [];
    if (!purpose.trim() && !fields.purpose) stillBlank.push(FIELD_LABELS.purpose);
    if (!host.trim() && !fields.host) stillBlank.push(FIELD_LABELS.host);
    if (!destination.trim() && !fields.destination) stillBlank.push(FIELD_LABELS.destination);
    if (!inclusiveDate && !fields.datesFrom) stillBlank.push(FIELD_LABELS.datesFrom);
    if (!exclusiveDate && !fields.datesTo) stillBlank.push(FIELD_LABELS.datesTo);

    Swal.fire({
      icon: (filled.length || travelerNote) ? 'success' : 'warning',
      title: (filled.length || travelerNote) ? 'Auto-filled from PDF' : "Couldn't find any details",
      html: [
        travelerNote,
        filled.length ? `<b>Filled in:</b> ${filled.join(', ')}` : '',
        stillBlank.length ? `<b>Please fill in manually:</b> ${stillBlank.map((key) => FIELD_LABELS[key]).join(', ')}` : '',
      ].filter(Boolean).join('<br/>'),
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

const handleSubmit = async () => {
  // Validation
  const missingFields = [];
  if (!travelers.length || !travelers[0].name) missingFields.push('Traveler Name');
  if (!travelers[0].position) missingFields.push('Position/Designation');
  if (!travelers[0].station) missingFields.push('Official/Station');
  if (!purpose.trim()) missingFields.push('Purpose of Travel');
  if (!host.trim()) missingFields.push('Host of Activity');
  if (!inclusiveDate) missingFields.push('Inclusive Date');
  if (!exclusiveDate) missingFields.push('Exclusive Date');
  if (!destination.trim()) missingFields.push('Destination');
  if (!area) missingFields.push('Area');


  if (missingFields.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Fields',
      html: `Please fill in the following fields:<br><b>${missingFields.join(', ')}</b>`,
      confirmButtonText: 'OK',
    });
    return;
  }

  try {
    for (const traveler of travelers) {
      const travelDetails = {
        employee_ID: traveler.uid,
        PositionDesignation: traveler.position,
        Station: traveler.station,
        Purpose: purpose.trim(),
        Host: host.trim(),
        DatesFrom: dayjs(inclusiveDate).format('YYYY-MM-DD'),
        DatesTo: dayjs(exclusiveDate).format('YYYY-MM-DD'),
        Destination: destination.trim(),
        Area: area,
        sof: sourceOfFund.trim(),
      };

      const formData = new FormData();
      Object.entries(travelDetails).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (file) formData.append('attachment', file);

      await axios.post(`${baseURL}/api/travels`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    Swal.fire({
      icon: 'success',
      title: 'Submitted!',
      text: 'Travel details submitted successfully.',
      timer: 2000,
      showConfirmButton: false,
    });

    setTravelers([{ uid: '', name: '', position: '', station: '', initial: '' }]);
    setInclusiveDate(null);
    setExclusiveDate(null);
    setArea('');
    setPurpose('');
    setHost('');
    setDestination('');
    setSourceOfFund('Local Fund');
    setFile(null);
  } catch (err) {
    console.error('Failed to submit travel details:', err);
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: err.response?.data?.message || err.message,
    });
  }
};

  const handleRemoveTraveler = (index) => {
    const newTravelers = [...travelers];
    newTravelers.splice(index, 1); // Remove the traveler at the specified index
    setTravelers(newTravelers);
  };

  return (
    <Box
      className="bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg w-full max-w-[1100px]"
      sx={{ p: { xs: 2, sm: 3, md: 5 } }}
    >

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Autocomplete Component */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Autocomplete
              disablePortal
              options={employees.length > 0 ? employees : []}
              value={autocompleteValue}
              getOptionLabel={(option) => option.Initial || 'No Initial'}
              onChange={(e, selectedEmployee) => {
                if (selectedEmployee) {
                  const newTravelers = [...travelers];
                  newTravelers[newTravelers.length - 1] = {
                    uid: selectedEmployee.uid,
                    name: selectedEmployee.fullname,
                    position: selectedEmployee.positionTitle,
                    station: selectedEmployee.office,
                    initial: selectedEmployee.Initial,
                  };
                  setTravelers(newTravelers);
                  setAutocompleteValue(null);
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Initial/Code" variant="outlined" />
              )}
            />
          </Grid>
        </Grid>

        {/* Traveler(s) Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {travelers.map((traveler, index) => (
            <Grid container spacing={2} key={index} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Name"
                  value={traveler.name}
                  onChange={(e) => {
                    const newTravelers = [...travelers];
                    newTravelers[index].name = e.target.value.toUpperCase();
                    setTravelers(newTravelers);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Position/Designation"
                  value={traveler.position}
                  onChange={(e) => {
                    const newTravelers = [...travelers];
                    newTravelers[index].position = e.target.value.toUpperCase();
                    setTravelers(newTravelers);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Official/Station"
                  value={traveler.station}
                  onChange={(e) => {
                    const newTravelers = [...travelers];
                    newTravelers[index].station = e.target.value.toUpperCase();
                    setTravelers(newTravelers);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'center' } }}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveTraveler(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
        </Box>

        {/* Add Traveler Button */}
        <Button
          variant="outlined"
          onClick={() => {
            setTravelers([...travelers, { uid: '', name: '', position: '', station: '', initial: '' }]);
            setAutocompleteValue(null);
          }}
          sx={{ width: { xs: '100%', sm: 'fit-content' } }}
        >
          + Add Traveler
        </Button>

        {/* Purpose of Travel */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Purpose of Travel"
              variant="outlined"
              fullWidth
              multiline
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              sx={{ textTransform: 'uppercase' }}
            />
          </Grid>
        </Grid>

        {/* Host & Dates */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Host of Activity"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="From"
                value={inclusiveDate}
                onChange={(newValue) => setInclusiveDate(newValue)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="To"
                value={exclusiveDate}
                onChange={(newValue) => setExclusiveDate(newValue)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

        {/* Destination */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              variant="outlined"
              label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Source of Fund, Area Dropdown, Upload, Done Button */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              id="sof"
              required
              fullWidth
              disabled
              variant="outlined"
              label="Source of Fund"
              value={sourceOfFund}
              helperText="Always Local Fund for this office"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="area-select-label">Area</InputLabel>
              <Select
                labelId="area-select-label"
                id="area-select"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                label="Area"
              >
                <MenuItem value="Division">Division</MenuItem>
                <MenuItem value="Region">Region</MenuItem>
                <MenuItem value="National">National</MenuItem>
                <MenuItem value="Abroad">Abroad</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="outlined"
              component="label"
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
                  const selectedFile = e.target.files[0];
                  e.target.value = '';
                  if (selectedFile) handlePdfSelect(selectedFile);
                }}
              />
            </Button>

            {file && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap', // Prevent text from wrapping
                  overflow: 'hidden', // Hide overflowed text
                  textOverflow: 'ellipsis', // Add ellipsis for overflowed text
                  maxWidth: '100%',
                }}
              >
                Selected file: {file.name}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 2 }}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: 48 }}
              onClick={handleSubmit}
            >
              Done
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default TravelInput;
