import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Typography,
  Box,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import DetailRow from './reusable_components/DetailRow';
import EmptyState from './reusable_components/EmptyState';
import TableSkeleton from './reusable_components/TableSkeleton';

const TravelDetails = ({ searchQuery: initialSearchQuery }) => {
  const [data, setData] = useState([]);
  const [stations, setStations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stationFilter, setStationFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [sortMode, setSortMode] = useState('uploaded'); // 'uploaded' = API order (newest uploaded first) | 'fileDate' = Travel Period date
  const baseURL = import.meta.env.VITE_API_URL;

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [travelRes, employeeRes] = await Promise.all([
          fetch(`${baseURL}/api/travels`),
          fetch(`${baseURL}/api/employees`),
        ]);

        const [travels, employees] = await Promise.all([
          travelRes.json(),
          employeeRes.json(),
        ]);

        const merged = travels.map((travel) => {
          const match = employees.find(emp => emp.uid === travel.employee_ID);
          return {
            ...travel,
            Fullname: match ? match.fullname : 'Unknown',
          };
        });

        setData(merged);
        setStations([...new Set(merged.map(t => t.Station).filter(Boolean))]);
        setAreas([...new Set(merged.map(t => t.Area).filter(Boolean))]);
        setPositions([...new Set(merged.map(t => t.PositionDesignation).filter(Boolean))]);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = data.filter((item) => {
    const matchesStation = stationFilter ? item.Station === stationFilter : true;
    const matchesArea = areaFilter ? item.Area === areaFilter : true;
    const matchesPosition = positionFilter ? item.PositionDesignation === positionFilter : true;
    const matchesSearch = searchQuery
      ? Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;
    return matchesStation && matchesArea && matchesPosition && matchesSearch;
  });

  // 'uploaded' keeps the API's own order (newest record first); 'fileDate' resorts by the travel's own date.
  const sortedData = sortMode === 'fileDate'
    ? [...filteredData].sort((a, b) => new Date(b.DatesFrom) - new Date(a.DatesFrom))
    : filteredData;

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
  <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 2 }}>
    {/* Filters */}
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
      {/* Search */}
      <Box flex={1}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          label="Search"
          size="small"
        />
      </Box>

      {/* Filters */}
      <Box flex={1}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="station-filter-label">Filter by Station</InputLabel>
          <Select
            labelId="station-filter-label"
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            label="Filter by Station"
          >
            <MenuItem value="">All Stations</MenuItem>
            {stations.map((station) => (
              <MenuItem key={station} value={station}>
                {station}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box flex={1}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="area-filter-label">Filter by Area</InputLabel>
          <Select
            labelId="area-filter-label"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            label="Filter by Area"
          >
            <MenuItem value="">All Areas</MenuItem>
            {areas.map((area) => (
              <MenuItem key={area} value={area}>
                {area}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box flex={1}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="position-filter-label">Filter by Position</InputLabel>
          <Select
            labelId="position-filter-label"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            label="Filter by Position"
          >
            <MenuItem value="">All Positions</MenuItem>
            {positions.map((position) => (
              <MenuItem key={position} value={position}>
                {position}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box flex={1}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="sort-by-label">Sort by</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            label="Sort by"
          >
            <MenuItem value="uploaded">Date Uploaded</MenuItem>
            <MenuItem value="fileDate">Travel Date</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Stack>

    {/* Responsive Table or Accordion */}
    {!isSmall ? (
      <>
        <TableContainer component={Paper} sx={{ maxHeight: 650, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 125, whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 3 }}>Name</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Position</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Station</TableCell>
                <TableCell sx={{ minWidth: 250 }}>Purpose</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Host</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Travel Period</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Destination</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Source of Fund</TableCell>
                <TableCell>Area</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={9} />
              ) : sortedData.map((row, index) => (
                <TableRow
                  key={index}
                  hover
                  onClick={() => setSelectedTravel(row)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell
                    sx={{
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'white',
                      zIndex: 1,
                    }}
                  >
                    {row.Attachment ? (
                      <a
                        href={`${baseURL}${row.Attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="no-underline font-medium text-brand-navy hover:text-brand-accent transition-colors"
                      >
                        {row.Fullname}
                      </a>
                    ) : row.Fullname}
                  </TableCell>
                  <TableCell>{row.PositionDesignation}</TableCell>
                  <TableCell>{row.Station}</TableCell>
                  <TableCell>{row.Purpose}</TableCell>
                  <TableCell>{row.Host}</TableCell>
                  <TableCell>
                    {row.DatesFrom && row.DatesTo
                      ? `${dayjs(row.DatesFrom).format('MMM DD')} - ${dayjs(row.DatesTo).format('MMM DD, YYYY')}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{row.Destination}</TableCell>
                  <TableCell>{row.sof}</TableCell>
                  <TableCell>{row.Area}</TableCell>
                </TableRow>
              ))}
              {!loading && sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <EmptyState message="No records found" hint="Try adjusting your filters or search." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Total Data Count */}
        <Box sx={{ mt: 2, textAlign: { xs: 'center', md: 'end' } }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Total Entries: {sortedData.length}
          </Typography>
        </Box>
      </>
    ) : (
      <Alert severity="info">Use a larger screen to view full travel details.</Alert>
    )}

    <Dialog
      open={Boolean(selectedTravel)}
      onClose={() => setSelectedTravel(null)}
      maxWidth="sm"
      fullWidth
    >
      {selectedTravel && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedTravel.Fullname || 'Travel Details'}
            <IconButton onClick={() => setSelectedTravel(null)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <DetailRow label="Position" value={selectedTravel.PositionDesignation} />
              <DetailRow label="Station" value={selectedTravel.Station} />
              <DetailRow label="Purpose" value={selectedTravel.Purpose} />
              <DetailRow label="Host" value={selectedTravel.Host} />
              <DetailRow label="Destination" value={selectedTravel.Destination} />
              <DetailRow
                label="Travel Period"
                value={
                  selectedTravel.DatesFrom && selectedTravel.DatesTo
                    ? `${dayjs(selectedTravel.DatesFrom).format('MMM DD, YYYY')} - ${dayjs(selectedTravel.DatesTo).format('MMM DD, YYYY')}`
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

export default TravelDetails;