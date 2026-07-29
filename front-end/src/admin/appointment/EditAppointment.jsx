import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button, FormControl,
  Select, MenuItem, InputLabel, TableSortLabel,
  InputAdornment, Tooltip, Link
} from '@mui/material';
import { Edit, Delete, Search as SearchIcon, Save as SaveIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import AppShell from '../../Components/AppShell';
import StatusChip from '../../Components/reusable_components/StatusChip';
import EmptyState from '../../Components/reusable_components/EmptyState';
import TableSkeleton from '../../Components/reusable_components/TableSkeleton';
import { ADMIN_APPOINTMENT_NAV_LINKS } from '../../config/navLinks';

const showSwal = (options) => {
  Swal.fire({
    ...options,
    didOpen: () => {
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '2000'; // Ensure Swal is above MUI Dialog
      }
    },
  });
};

// Exported separately so the admin dashboard can render this content inline
// (inside its container-transform overlay) without a nested AppShell. All
// state/logic/data-fetching below is unchanged from the original component.
export const EditAppointmentContent = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortMode, setSortMode] = useState('dateSigned'); // 'dateSigned' = current default (Date Signed, newest first) | 'uploaded' = record upload order
  const [loading, setLoading] = useState(true);
  const baseURL = import.meta.env.VITE_API_URL;
const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/appointments`);
      setAppointments(res.data);
      setFilteredAppointments(res.data); // Initialize filtered appointments
    } catch (error) {
      showSwal({
        icon: 'error',
        title: 'Error',
        text: `Failed to fetch appointments: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won’t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/api/appointment/${id}`);
        showSwal({
          icon: 'success',
          title: 'Deleted!',
          text: 'The appointment has been deleted.',
        });
        fetchAppointments();
      } catch (error) {
        showSwal({
          icon: 'error',
          title: 'Error',
          text: `Failed to delete appointment: ${error.message}`,
        });
      }
    }
  };

  const handleUpdate = async () => {
    const formData = new FormData();

    // Add fields to the formData
    formData.append('name', editing.Name);
    formData.append('positionTitle', editing.PositionTitle);
    formData.append('schoolOffice', editing.SchoolOffice);
    formData.append('district', editing.District);
    formData.append('statusOfAppointment', editing.StatusOfAppointment);
    formData.append('natureAppointment', editing.NatureAppointment);
    formData.append('itemNo', editing.ItemNo);
    formData.append('dateSigned', editing.DateSigned);
    formData.append(
      'released',
      editing.releasedAt
        ? new Date(editing.releasedAt).toISOString().slice(0, 19).replace('T', ' ') // Convert local to UTC for backend
        : ''
    );
    formData.append('remarks', editing.remarks || ''); // Include remarks

    if (editing.pdf) {
      formData.append('pdf', editing.pdf);
    }

    try {
      await axios.put(`${baseURL}/api/appointment/${editing.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showSwal({
        icon: 'success',
        title: 'Success',
        text: 'Appointment updated successfully!',
      });
      setOpen(false);
      fetchAppointments();
    } catch {
      showSwal({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update appointment. Please check the data and try again.',
      });
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredAppointments(
      appointments.filter((appointment) =>
        appointment.Name?.toLowerCase().includes(term)
      )
    );
  };

  const formatToLocalDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr); // Parse date string
    const tzOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localDate = new Date(date.getTime() - tzOffset); // Adjust to local time
    return localDate.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:mm
  };

  const handleEditClick = (row) => {
    setEditing({
      ...row,
      DateSigned: row.DateSigned
        ? new Date(row.DateSigned).toISOString().slice(0, 10) // Format as YYYY-MM-DD
        : '',
      releasedAt: formatToLocalDateTime(row.releasedAt), // Convert to local time for datetime-local input
      remarks: row.remarks || '', // Ensure remarks is included with a default value
    });
    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

 const [sortColumn, setSortColumn] = useState(''); // Track the current sorting column
 // Track the sorting order

// Sorting logic
const handleSort = (column) => {
  const isAsc = sortColumn === column && sortOrder === 'asc';
  setSortOrder(isAsc ? 'desc' : 'asc');
  setSortColumn(column);

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const valueA = a[column] || '';
    const valueB = b[column] || '';
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return isAsc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return isAsc ? valueA - valueB : valueB - valueA;
  });

  setFilteredAppointments(sortedAppointments);
};

  const saveButtonRef = useRef(null);
  // Add keyboard shortcut for Alt+U
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'u') {
        if (open && fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
      if (e.key === 'Enter') {
        if (open && saveButtonRef.current) {
          saveButtonRef.current.click();
        }
      }
       if (e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault(); // Prevent default browser behavior
      if (searchInputRef.current) {
        searchInputRef.current.focus(); // Focus the search bar
      }
    }
      
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
      <Box sx={{ maxWidth: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            width: '70%',
            maxWidth: 1200,
            mt: 1,
            mb: 2,
          }}
        >
          <TextField
            fullWidth
            label="Search by Name"
            value={searchTerm}
            onChange={handleSearch}
            inputRef={searchInputRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortMode} label="Sort by" onChange={(e) => setSortMode(e.target.value)}>
              <MenuItem value="uploaded">Date Uploaded</MenuItem>
              <MenuItem value="dateSigned">Date Signed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <TableContainer component={Paper} sx={{ maxHeight: 650, width: '100%', maxWidth: 1800 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3 }}><TableSortLabel
        active={sortColumn === 'Name'}
        direction={sortColumn === 'Name' ? sortOrder : 'asc'}
        onClick={() => handleSort('Name')}
      >
        Name
      </TableSortLabel></TableCell>
                  <TableCell><TableSortLabel
        active={sortColumn === 'PositionTitle'}
        direction={sortColumn === 'PositionTitle' ? sortOrder : 'asc'}
        onClick={() => handleSort('PositionTitle')}
      >
        Position
      </TableSortLabel></TableCell>
                  <TableCell><TableSortLabel
        active={sortColumn === 'SchoolOffice'}
        direction={sortColumn === 'SchoolOffice' ? sortOrder : 'asc'}
        onClick={() => handleSort('SchoolOffice')}
      >
        Office
      </TableSortLabel></TableCell>
                  <TableCell><TableSortLabel
        active={sortColumn === 'District'}
        direction={sortColumn === 'District' ? sortOrder : 'asc'}
        onClick={() => handleSort('District')}
      >
        District
      </TableSortLabel></TableCell>
                  <TableCell><TableSortLabel
        active={sortColumn === 'StatusOfAppointment'}
        direction={sortColumn === 'StatusOfAppointment' ? sortOrder : 'asc'}
        onClick={() => handleSort('StatusOfAppointment')}
      >
        Status
      </TableSortLabel></TableCell>
                  <TableCell><TableSortLabel
        active={sortColumn === 'NatureAppointment'}
        direction={sortColumn === 'NatureAppointment' ? sortOrder : 'asc'}
        onClick={() => handleSort('NatureAppointment')}
      >
        Nature
      </TableSortLabel></TableCell>
                  <TableCell>
      <TableSortLabel
        active={sortColumn === 'ItemNo'}
        direction={sortColumn === 'ItemNo' ? sortOrder : 'asc'}
        onClick={() => handleSort('ItemNo')}
      >
        Item No
      </TableSortLabel>
    </TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>PDF</TableCell>
                  <TableCell>Date Released</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableSkeleton columns={11} />
                ) : (sortMode === 'uploaded'
                  ? [...filteredAppointments].sort((a, b) => b.id - a.id)
                  : [...filteredAppointments].sort((a, b) => new Date(b.DateSigned) - new Date(a.DateSigned))
                ).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }}>{row.Name}</TableCell>
                      <TableCell>{row.PositionTitle}</TableCell>
                      <TableCell>{row.SchoolOffice}</TableCell>
                      <TableCell>{row.District}</TableCell>
                      <TableCell>
                        {row.StatusOfAppointment ? (
                          <StatusChip label={row.StatusOfAppointment} />
                        ) : ''}
                      </TableCell>
                      <TableCell>
                        {row.NatureAppointment ? (
                          <StatusChip label={row.NatureAppointment} />
                        ) : ''}
                      </TableCell>
                      <TableCell>{row.ItemNo}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.DateSigned && !isNaN(new Date(row.DateSigned))
                          ? (() => {
                              const date = new Date(row.DateSigned);
                              const month = date.toLocaleString('en-US', { month: 'short' });
                              const day = String(date.getDate()).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${month}-${day}-${year}`;
                            })()
                          : ''}
                      </TableCell>
                      <TableCell>
                        {row.pdfPath ? (
                          <Link
                            href={`${baseURL}/${row.pdfPath}`}
                            target="_blank"
                            rel="noreferrer"
                            color="primary"
                            underline="hover"
                          >
                            View
                          </Link>
                        ) : (
                          'No PDF Available'
                        )}
                      </TableCell>
                       <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.releasedAt && !isNaN(new Date(row.releasedAt))
                          ? (() => {
                              const date = new Date(row.releasedAt);
                              const month = date.toLocaleString('en-US', { month: 'short' });
                              const day = String(date.getDate()).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${month}-${day}-${year}`;
                            })()
                          : ''}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title="Edit">
                            <IconButton color="primary" onClick={() => handleEditClick(row)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(row.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && filteredAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <EmptyState message="No appointments found" hint="Try a different search term." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogContent>
            {['Name', 'PositionTitle', 'SchoolOffice', 'District'].map((field) => (
              <TextField
                key={field}
                margin="dense"
                name={field}
                label={field}
                type="text"
                fullWidth
                value={editing?.[field] || ''}
                onChange={handleChange}
              />
            ))}

            <FormControl fullWidth margin="dense">
              <InputLabel>Status of Appointment</InputLabel>
              <Select
                name="StatusOfAppointment"
                value={editing?.StatusOfAppointment || ''}
                onChange={handleChange}
                label="Status of Appointment"
              >
                <MenuItem value="PERMANENT">PERMANENT</MenuItem>
                <MenuItem value="TEMPORARY">TEMPORARY</MenuItem>
                <MenuItem value="PROVISIONAL">PROVISIONAL</MenuItem>
                <MenuItem value="SUBSTITUTE">SUBSTITUTE</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Nature of Appointment</InputLabel>
              <Select
                name="NatureAppointment"
                value={editing?.NatureAppointment || ''}
                onChange={handleChange}
                label="Nature of Appointment"
              >
                <MenuItem value="ORIGINAL">ORIGINAL</MenuItem>
                <MenuItem value="PROMOTION">PROMOTION</MenuItem>
                <MenuItem value="TRANSFER">TRANSFER</MenuItem>
                <MenuItem value="REAPPOINTMENT">REAPPOINTMENT</MenuItem>
                <MenuItem value="REEMPLOYMENT">REEMPLOYMENT</MenuItem>
                <MenuItem value="DEMOTION">DEMOTION</MenuItem>
                <MenuItem value="RECLASSIFICATION">RECLASSIFICATION</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              name="ItemNo"
              label="Item No"
              type="text"
              fullWidth
              value={editing?.ItemNo || ''}
              onChange={handleChange}
            />

            <TextField
              margin="dense"
              name="DateSigned"
              label="Date Signed"
              type="date"
              fullWidth
              value={editing?.DateSigned || ''}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              margin="dense"
              name="releasedAt"
              label="Release Date"
              type="datetime-local"
              fullWidth
              value={editing?.releasedAt || ''}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              margin="dense"
              name="remarks"
              label="Remarks"
              type="text"
              fullWidth
              value={editing?.remarks || ''}
              onChange={handleChange}
            />

            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ mt: 2 }}>
              Upload PDF
              <input
                type="file"
                accept="application/pdf"
                hidden
                 ref={fileInputRef}
                onChange={(e) => {
                  setEditing((prev) => ({ ...prev, pdf: e.target.files[0] }));
                  e.target.value = '';
                }}
              />
            </Button>
            {editing?.pdf && (
              <Typography variant="body2" mt={1}>
                Selected file: {editing.pdf.name}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleUpdate} ref={saveButtonRef}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

const EditAppointment = () => (
  <AppShell title="Manage Appointments" navLinks={ADMIN_APPOINTMENT_NAV_LINKS} showLogout>
    <EditAppointmentContent />
  </AppShell>
);

export default EditAppointment;