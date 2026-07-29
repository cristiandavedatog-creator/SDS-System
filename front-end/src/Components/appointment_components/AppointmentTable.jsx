import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Box, Typography, Table,  TableBody,  TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, Select,
  MenuItem,
  InputLabel,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Divider,
} from '@mui/material';
import { BRAND } from '../../theme/theme';
import StatusChip from '../reusable_components/StatusChip';
import EmptyState from '../reusable_components/EmptyState';
import TableSkeleton from '../reusable_components/TableSkeleton';

const AppointmentTable = ({ searchQuery, setSearchQuery }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionOptions, setPositionOptions] = useState([]);

  const [natureOptions, setNatureOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [selectedNature, setSelectedNature] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedReleaseStatus, setSelectedReleaseStatus] = useState(''); // Dropdown filter for release status
  const [selectedPosition, setSelectedPosition] = useState(''); // Dropdown filter for position
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [releaseInfo, setReleaseInfo] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState(null);
  const [sortMode, setSortMode] = useState('uploaded'); // 'uploaded' = API order (newest uploaded first) | 'dateSigned' = Date Signed
  const baseURL = import.meta.env.VITE_API_URL;

  const handleViewDetails = (appointment) => {
    setDetailsRow(appointment);
    setDetailsDialogOpen(true);
  };

  useEffect(() => {
    axios.get(`${baseURL}/api/appointments`)
      .then((res) => {
        setAppointments(res.data);
        setLoading(false);
        const uniquePositions = [...new Set(res.data.map(item => item.PositionTitle))].filter(Boolean);
        const uniqueNature = [...new Set(res.data.map(item => item.NatureAppointment))].filter(Boolean);
        const uniqueStatus = [...new Set(res.data.map(item => item.StatusOfAppointment))].filter(Boolean);
        const uniqueDistricts = [...new Set(res.data.map(item => item.District))].filter(Boolean);
        setNatureOptions(uniqueNature);
        setStatusOptions(uniqueStatus);
        setDistrictOptions(uniqueDistricts);
        setPositionOptions(uniquePositions);
      })
      .catch((err) => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  }, []);

  const handleRelease = (appointment) => {
    setSelectedAppointment(appointment);
    setReleaseDialogOpen(true);
  };

  const confirmRelease = () => {
    axios.post(`${baseURL}/api/appointment/${selectedAppointment.id}/release`)
      .then(() => {
        const releaseTime = new Date().toLocaleString('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        // Update the appointment locally
        setAppointments((prev) =>
          prev.map((app) =>
            app.id === selectedAppointment.id ? { ...app, releasedAt: releaseTime } : app
          )
        );

        setReleaseDialogOpen(false);
        setSelectedAppointment(null);
      })
      .catch((err) => {
        console.error('Error releasing appointment:', err);
        Swal.fire({
          icon: 'error',
          title: 'Release Failed',
          text: 'Failed to release the appointment. Please try again.',
        });
      });
  };

  const handleViewReleaseInfo = (appointment) => {
    setSelectedAppointment(appointment);
    axios.get(`${baseURL}/api/appointment/${appointment.id}/release-info`)
      .then((res) => {
        const releaseDate = new Date(res.data.releasedAt);

        // Format the date and time
        const formattedDate = releaseDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        const formattedTime = releaseDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        // Include remarks in the dialog
        setReleaseInfo({
          date: formattedDate,
          time: formattedTime,
          remarks: appointment.remarks || 'No remarks available', // Added remarks field
        });

        setViewDialogOpen(true);
      })
      .catch((err) => {
        console.error('Error fetching release info:', err);
        Swal.fire({
          icon: 'error',
          title: 'Fetch Failed',
          text: 'Failed to fetch release information.',
        });
      });
  };

  const filteredAppointments = appointments
    .filter((row) => {
      const matchesSearch = Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesNature = selectedNature ? row.NatureAppointment === selectedNature : true;
      const matchesStatus = selectedStatus ? row.StatusOfAppointment === selectedStatus : true;
      const matchesDistrict = selectedDistrict ? row.District === selectedDistrict : true;
      const matchesPosition = selectedPosition ? row.PositionTitle === selectedPosition : true; // Matches based on position dropdown
      const matchesReleaseStatus =
        selectedReleaseStatus === 'Released'
          ? row.releasedAt
          : selectedReleaseStatus === 'Not Released'
          ? !row.releasedAt
          : true; // Matches based on release status dropdown
      return matchesSearch && matchesNature && matchesStatus && matchesDistrict && matchesReleaseStatus && matchesPosition;
    });

  // 'uploaded' keeps the API's own order (newest record first); 'dateSigned' resorts by the appointment's Date Signed.
  const sortedAppointments = sortMode === 'dateSigned'
    ? [...filteredAppointments].sort((a, b) => new Date(b.DateSigned) - new Date(a.DateSigned))
    : filteredAppointments;

  return (
    <Box sx={{ margin: 'auto', px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2, md: 3 } }}>
      {/* Search and Filters */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          mb: 3,
          gap: { xs: 2, md: 0 },
        }}
      >
        <TextField
          sx={{ minWidth: { xs: '100%', sm: 220, md: 220 }, maxWidth: { md: 220 }, flexShrink: 0, mb: { xs: 2, md: 0 } }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          label="Search here"
          size="small"
          fullWidth={true}
        />
        <Box
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 1.5,
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            overflowX: { md: 'auto' },
          }}
        >
          <FormControl sx={{ minWidth: 140, flex: 1, maxWidth: 140 }} size="small" fullWidth={true}>
  <InputLabel>Position</InputLabel>
  <Select
    value={selectedPosition}
    onChange={(e) => setSelectedPosition(e.target.value)}
    label="Position"
  >
    <MenuItem value="">
      <em>All</em>
    </MenuItem>
    {positionOptions
      .slice() // Create a shallow copy to avoid mutating the original array
      .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
      .map((option, idx) => (
        <MenuItem key={idx} value={option}>
          {option}
        </MenuItem>
      ))}
  </Select>
</FormControl>

          <FormControl sx={{ minWidth: 140, flex: 1, maxWidth: 140 }} size="small" fullWidth={true}>
            <InputLabel>District</InputLabel>
            <Select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              label="District"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {districtOptions
              .slice()
              .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
              .map((option, idx) => (
                <MenuItem key={idx} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 140, flex: 1, maxWidth: 140 }} size="small" fullWidth={true}>
            <InputLabel>Status of Appointment</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status of Appointment"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {statusOptions
              .slice()
              .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
              .map((option, idx) => (
                <MenuItem key={idx} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 140, flex: 1, maxWidth: 140 }} size="small" fullWidth={true}>
            <InputLabel>Nature of Appointment</InputLabel>
            <Select
              value={selectedNature}
              onChange={(e) => setSelectedNature(e.target.value)}
              label="Nature of Appointment"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {natureOptions
              .slice()
              .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
              .map((option, idx) => (
                <MenuItem key={idx} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 140, flex: 1, maxWidth: 140 }} size="small" fullWidth={true}>
            <InputLabel>Release Status</InputLabel>
            <Select
              value={selectedReleaseStatus}
              onChange={(e) => setSelectedReleaseStatus(e.target.value)}
              label="Release Status"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              <MenuItem value="Released">Released</MenuItem>
              <MenuItem value="Not Released">Not Released</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 140, flex: 1, maxWidth: 140 }} size="small" fullWidth={true}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="uploaded">Date Uploaded</MenuItem>
              <MenuItem value="dateSigned">Date Signed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{
              maxHeight: 650,
              overflow: 'auto',
              minWidth: { xs: 700, sm: 900 },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      whiteSpace: 'nowrap',
                      width: 180,
                      textAlign: 'start',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: BRAND.tableHead,
                      zIndex: 3,
                    }}
                  >
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 150, textAlign: 'start' }}><strong>Position Title</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 160, textAlign: 'start' }}><strong>School/Office</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 160, textAlign: 'start' }}><strong>District</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 160, textAlign: 'start' }}><strong>Status of Appointment</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 160, textAlign: 'start' }}><strong>Nature of Appointment</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 130, textAlign: 'start' }}><strong>Item No.</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 130, textAlign: 'start' }}><strong>Date Signed</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', width: 130, textAlign: 'start' }}><strong>Released</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={9} />
                ) : sortedAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <EmptyState message="No appointments found" hint="Try adjusting your filters or search." />
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAppointments.map((row, index) => (
                    <TableRow
                      key={row.id} // Ensure `row.id` is unique
                      hover
                      onClick={() => handleViewDetails(row)}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell
                        sx={{
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                          zIndex: 1,
                        }}
                      >
                        {row.pdfPath ? (
                          <a
                            href={`${baseURL}/${row.pdfPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ textDecoration: 'none', color: BRAND.navy, fontWeight: 500 }}
                          >
                            {row.Name}
                          </a>
                        ) : row.Name}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.PositionTitle}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.SchoolOffice}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'start' }}>{row.District}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'start' }}>
                        {row.StatusOfAppointment ? (
                          <StatusChip label={row.StatusOfAppointment} statusKey={row.StatusOfAppointment} />
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'start' }}>{row.NatureAppointment}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'start' }}>
                        {row.ItemNo}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
  {row.DateSigned && !isNaN(new Date(row.DateSigned))
    ? (() => {
        const date = new Date(row.DateSigned);
        const month = date.toLocaleString('en-US', { month: 'short' }); // e.g. "Jul"
        const day = String(date.getDate()).padStart(2, '0');             // e.g. "30"
        const year = date.getFullYear();                                 // e.g. "2025"
        return `${month}-${day}-${year}`;
      })()
    : ''}
</TableCell>

                      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {row.releasedAt ? (
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => handleViewReleaseInfo(row)}
                          >
                            View
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleRelease(row)}
                          >
                            Release
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Total Data Count */}
          {!loading && (
            <Box sx={{ mt: 2, textAlign: { xs: 'center', md: 'end' } }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Total Entries: {sortedAppointments.length}
              </Typography>
            </Box>
          )}
      </Box>

      {/* Release Confirmation Modal */}
      <Dialog
        open={releaseDialogOpen}
        onClose={() => setReleaseDialogOpen(false)}
      >
        <DialogTitle>Confirm Release</DialogTitle>
        <DialogContent>
          Are you sure you want to release this appointment?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRelease} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Release Info Modal */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
      >
        <DialogTitle>Release Information</DialogTitle>
        <DialogContent>
          <Typography variant="body1" component="div">
            {releaseInfo ? (
              <>
                <div>Date: {releaseInfo.date}</div>
                <div>Time: {releaseInfo.time}</div>
                <div>Remarks: {releaseInfo.remarks}</div>
              </>
            ) : (
              'No release information available.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Details Modal */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {detailsRow && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {[
                ['Name', detailsRow.Name],
                ['Position Title', detailsRow.PositionTitle],
                ['School/Office', detailsRow.SchoolOffice],
                ['District', detailsRow.District],
                ['Item No.', detailsRow.ItemNo],
                [
                  'Date Signed',
                  detailsRow.DateSigned && !isNaN(new Date(detailsRow.DateSigned))
                    ? new Date(detailsRow.DateSigned).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })
                    : 'N/A',
                ],
              ].map(([label, value]) => (
                <Grid size={6} key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2">{value || 'N/A'}</Typography>
                </Grid>
              ))}

              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Status of Appointment
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {detailsRow.StatusOfAppointment ? (
                    <StatusChip label={detailsRow.StatusOfAppointment} statusKey={detailsRow.StatusOfAppointment} />
                  ) : (
                    <Typography variant="body2">N/A</Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Nature of Appointment
                </Typography>
                <Typography variant="body2">{detailsRow.NatureAppointment || 'N/A'}</Typography>
              </Grid>

              <Grid size={12}>
                <Divider />
              </Grid>

              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Release Status
                </Typography>
                <Typography variant="body2">
                  {detailsRow.releasedAt ? `Released (${detailsRow.releasedAt})` : 'Not released'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Remarks
                </Typography>
                <Typography variant="body2">{detailsRow.remarks || 'None'}</Typography>
              </Grid>

              {detailsRow.pdfPath && (
                <Grid size={12}>
                  <Button
                    href={`${baseURL}/${detailsRow.pdfPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                  >
                    View Attached PDF
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentTable;