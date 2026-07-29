import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import dayjs from 'dayjs';
import StatusChip from './reusable_components/StatusChip';
import DetailRow from './reusable_components/DetailRow';
import EmptyState from './reusable_components/EmptyState';
import TableSkeleton from './reusable_components/TableSkeleton';
import { TRAVEL_STATUS_COLORS } from '../theme/travelStatus';

// Maps the MUI color name returned by getTravelStatus() to the shared
// TRAVEL_STATUS_COLORS key used by StatusChip.
const STATUS_KEY_BY_COLOR = {
  error: 'upcoming',
  success: 'completed',
  primary: 'ongoing',
};

const CustomTable = ({ searchQuery, statusFilter = 'total' }) => {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [sortMode, setSortMode] = useState('uploaded'); // 'uploaded' = API order (newest uploaded first) | 'fileDate' = Travel Period date
  const baseURL = import.meta.env.VITE_API_URL ;
  
  // Fetch travel data from API
  useEffect(() => {
    setLoading(true);
    axios.get(`${baseURL}/api/travels`)
      .then(response => {
        setTravels(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching travels:', err);
        setError('Failed to load travel data. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Get travel status based on dates
  const getTravelStatus = (travel) => {
    const now = dayjs();
    const startDate = dayjs(travel.DatesFrom);
    const endDate = dayjs(travel.DatesTo);

    if (startDate.isAfter(now)) {
      return { label: 'Upcoming', color: 'error' };
    } else if (endDate.isBefore(now)) {
      return { label: 'Completed', color: 'success' };
    } else {
      return { label: 'Ongoing', color: 'primary' };
    }
  };

  // Filter travels based on the selected status tile and the search query
  const filteredTravels = travels.filter(travel => {
    if (statusFilter !== 'total') {
      const statusKey = STATUS_KEY_BY_COLOR[getTravelStatus(travel).color];
      if (statusKey !== statusFilter) return false;
    }

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Search across all fields in the travel object
    return Object.values(travel).some((value) => {
      // Skip searching through non-string values or empty values
      if (typeof value !== 'string' && typeof value !== 'number') return false;
      if (value === null || value === undefined) return false;

      // Convert value to string and check if it includes the query
      return String(value).toLowerCase().includes(query);
    });
  });

  // Apply the chosen sort on top of the (already filtered) list.
  // 'uploaded' keeps the API's own order (newest record first); 'fileDate' resorts by the travel's own date.
  const sortedTravels = sortMode === 'fileDate'
    ? [...filteredTravels].sort((a, b) => new Date(b.DatesFrom) - new Date(a.DatesFrom))
    : filteredTravels;

  // Format date for display
  const formatDate = (dateString) => {
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Tints the whole table board with a light wash of whichever status tile is active,
  // so it's obvious at a glance that a filter is applied even without looking at the tiles.
  const boardTint = statusFilter !== 'total' ? TRAVEL_STATUS_COLORS[statusFilter].bg : '#fff';

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: boardTint,
        transition: 'background-color 0.25s ease',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, pb: 0 }}>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sortMode} label="Sort by" onChange={(e) => setSortMode(e.target.value)}>
            <MenuItem value="uploaded">Date Uploaded</MenuItem>
            <MenuItem value="fileDate">Travel Date</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table stickyHeader aria-label="travel data table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3 }}>Name</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Travel Period</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={5} />
            ) : sortedTravels
              .map((travel, index) => {
                const status = getTravelStatus(travel);
                return (
                  <TableRow
                    hover
                    key={index}
                    onClick={() => setSelectedTravel(travel)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ width: '20%', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 1, backgroundColor: boardTint, transition: 'background-color 0.25s ease' }}>
  {travel.fullname || 'N/A'}
</TableCell>
                    <TableCell>
  {travel.Attachment ? (
    <a
      href={`${baseURL}${travel.Attachment}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-brand-navy underline font-medium hover:text-brand-accent transition-colors"
    >
      {travel.Purpose || 'View PDF'}
    </a>
  ) : (
    travel.Purpose || 'None'
  )}
</TableCell>

                    <TableCell>{travel.Destination || 'N/A'}</TableCell>
                    <TableCell
                      sx={{ width: '20%', whiteSpace: 'nowrap' }}>
                      {travel.DatesFrom && travel.DatesTo ? 
                        `${formatDate(travel.DatesFrom)} - ${formatDate(travel.DatesTo)}` : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={status.label}
                        statusKey={STATUS_KEY_BY_COLOR[status.color]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            {!loading && filteredTravels.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <EmptyState message="No travel records found" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(selectedTravel)}
        onClose={() => setSelectedTravel(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTravel && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {selectedTravel.fullname || 'Travel Details'}
              <IconButton onClick={() => setSelectedTravel(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <DetailRow label="Status">
                  <StatusChip
                    label={getTravelStatus(selectedTravel).label}
                    statusKey={STATUS_KEY_BY_COLOR[getTravelStatus(selectedTravel).color]}
                  />
                </DetailRow>
                <DetailRow label="Position" value={selectedTravel.PositionDesignation} />
                <DetailRow label="Station" value={selectedTravel.Station} />
                <DetailRow label="Purpose" value={selectedTravel.Purpose} />
                <DetailRow label="Host" value={selectedTravel.Host} />
                <DetailRow label="Destination" value={selectedTravel.Destination} />
                <DetailRow
                  label="Travel Period"
                  value={
                    selectedTravel.DatesFrom && selectedTravel.DatesTo
                      ? `${formatDate(selectedTravel.DatesFrom)} - ${formatDate(selectedTravel.DatesTo)}`
                      : 'N/A'
                  }
                />
                <DetailRow label="Source of Fund" value={selectedTravel.sof} />
                <DetailRow label="Area" value={selectedTravel.Area} />
                <DetailRow label="Attachment">
                  {selectedTravel.Attachment ? (
                    <a
                      href={`${baseURL}${selectedTravel.Attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-navy underline font-medium hover:text-brand-accent transition-colors"
                    >
                      View PDF
                    </a>
                  ) : (
                    <Typography variant="body2" color="text.secondary">None</Typography>
                  )}
                </DetailRow>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelectedTravel(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default CustomTable;