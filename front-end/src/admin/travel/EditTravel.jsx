import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, IconButton, Dialog, DialogTitle, DialogActions,
  TablePagination, FormControl, InputLabel, Select, MenuItem, TableSortLabel, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import Swal from 'sweetalert2';
import AppShell from '../../Components/AppShell';
import dayjs from 'dayjs';
import { ADMIN_TRAVEL_NAV_LINKS } from '../../config/navLinks';
import EmptyState from '../../Components/reusable_components/EmptyState';
import TableSkeleton from '../../Components/reusable_components/TableSkeleton';

// SDO Camarines Norte groups its people into three broad categories for
// travel reporting. Derived from the position title recorded on the
// travel record itself (not a live employee lookup), so it still works
// for historical records even if someone's actual position has since
// changed. Head Teacher positions are grouped with Principals since a
// Head Teacher acts as the school head at smaller schools — same role,
// different title — rather than a classroom teacher.
const classifyPersonnel = (positionTitle) => {
  const title = (positionTitle || '').toUpperCase();
  if (title.includes('PRINCIPAL') || title.includes('HEAD TEACHER') || /\bHT\b/.test(title)) {
    return 'Principals';
  }
  if (title.includes('TEACHER')) return 'Teaching Staff';
  return 'SDO Personnel';
};

const PERSONNEL_CATEGORIES = ['SDO Personnel', 'Teaching Staff', 'Principals'];

const AdminTravelTable = () => {
  const [travels, setTravels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editDialog, setEditDialog] = useState({ open: false, data: null });
const [editFile, setEditFile] = useState(null);
  const [sortMode, setSortMode] = useState('uploaded'); // 'uploaded' = API order (newest uploaded first) | 'fileDate' = Travel Date; only applies when no column header sort is active
  const baseURL = import.meta.env.VITE_API_URL;


  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchTravels();
  }, []);

  const fetchTravels = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/travels`);
      setTravels(res.data);
      // Re-apply whatever filters are currently active instead of always
      // showing everything, so a delete/save refresh doesn't silently
      // clear the admin's Search/Position/Station/Category selections.
      applyFilters(res.data, search, positionFilter, stationFilter, categoryFilter);
    } catch (err) {
      console.error('Failed to fetch travels:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combines all three filters together so changing one doesn't clobber the
  // others — each handler below passes its own new value in directly
  // (rather than reading back the just-set state, which wouldn't be
  // updated yet within the same synchronous call). Takes the source array
  // explicitly rather than always reading the `travels` state, so a fresh
  // fetch can filter its own just-arrived data without waiting a render
  // for that state to catch up.
  const applyFilters = (source, searchVal, positionVal, stationVal, categoryVal) => {
    setFiltered(
      source.filter((t) => {
        const matchesSearch = !searchVal || t.fullname?.toLowerCase().includes(searchVal);
        const matchesPosition = !positionVal || t.PositionDesignation === positionVal;
        const matchesStation = !stationVal || t.Station === stationVal;
        const matchesCategory = !categoryVal || classifyPersonnel(t.PositionDesignation) === categoryVal;
        return matchesSearch && matchesPosition && matchesStation && matchesCategory;
      })
    );
  };

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setSearch(val);
    applyFilters(travels, val, positionFilter, stationFilter, categoryFilter);
  };

  const handlePositionFilterChange = (e) => {
    const val = e.target.value;
    setPositionFilter(val);
    applyFilters(travels, search, val, stationFilter, categoryFilter);
  };

  const handleStationFilterChange = (e) => {
    const val = e.target.value;
    setStationFilter(val);
    applyFilters(travels, search, positionFilter, val, categoryFilter);
  };

  const handleCategoryFilterChange = (e) => {
    const val = e.target.value;
    setCategoryFilter(val);
    applyFilters(travels, search, positionFilter, stationFilter, val);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${baseURL}/api/travels/${deleteDialog.id}`);
      setDeleteDialog({ open: false, id: null });
      fetchTravels();
    } catch (err) {
      console.error('Delete failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete the travel record. Please try again.',
      });
    }
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

   const [sortColumn, setSortColumn] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
   // Sorting logic
  const handleSort = (column) => {
    const isAsc = sortColumn === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortColumn(column);

    const sorted = [...filtered].sort((a, b) => {
      let valueA = a[column] || '';
      let valueB = b[column] || '';
      // For fullname, sort case-insensitive
      if (column === 'fullname') {
        return isAsc
          ? valueA.toLowerCase().localeCompare(valueB.toLowerCase())
          : valueB.toLowerCase().localeCompare(valueA.toLowerCase());
      }
      // For date, compare as Date objects
      if (column === 'date_signed') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
        return isAsc ? valueA - valueB : valueB - valueA;
      }
      // For string columns
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return isAsc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      return isAsc ? valueA - valueB : valueB - valueA;
    });

    setFiltered(sorted);
  };

  // Only kicks in when no column header sort is active, so clicking a column header still works as before.
  const displayedTravels = sortColumn
    ? filtered
    : sortMode === 'fileDate'
    ? [...filtered].sort((a, b) => new Date(b.DatesFrom) - new Date(a.DatesFrom))
    : filtered;

  const positionOptions = [...new Set(travels.map((t) => t.PositionDesignation).filter(Boolean))].sort();
  const stationOptions = [...new Set(travels.map((t) => t.Station).filter(Boolean))].sort();


  return (
    <AppShell title="Edit Travel" navLinks={ADMIN_TRAVEL_NAV_LINKS} showLogout>
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          fullWidth
          label="Search by Name"
          value={search}
          onChange={handleSearch}
        />
        <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
          <InputLabel>Position</InputLabel>
          <Select value={positionFilter} label="Position" onChange={handlePositionFilterChange}>
            <MenuItem value=""><em>All Positions</em></MenuItem>
            {positionOptions.map((position) => (
              <MenuItem key={position} value={position}>{position}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
          <InputLabel>Station</InputLabel>
          <Select value={stationFilter} label="Station" onChange={handleStationFilterChange}>
            <MenuItem value=""><em>All Stations</em></MenuItem>
            {stationOptions.map((station) => (
              <MenuItem key={station} value={station}>{station}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
          <InputLabel>Personnel Type</InputLabel>
          <Select value={categoryFilter} label="Personnel Type" onChange={handleCategoryFilterChange}>
            <MenuItem value=""><em>All Personnel</em></MenuItem>
            {PERSONNEL_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sortMode} label="Sort by" onChange={(e) => setSortMode(e.target.value)}>
            <MenuItem value="uploaded">Date Uploaded</MenuItem>
            <MenuItem value="fileDate">Travel Date</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3 }}><TableSortLabel
        active={sortColumn === 'fullname'}
        direction={sortColumn === 'fullname' ? sortOrder : 'asc'}
        onClick={() => handleSort('fullname')}
      >
        Name
      </TableSortLabel></TableCell>
              <TableCell><TableSortLabel
        active={sortColumn === 'PositionDesignation'}
        direction={sortColumn === 'PositionDesignation' ? sortOrder : 'asc'}
        onClick={() => handleSort('PositionDesignation')}
      >
        Position
      </TableSortLabel></TableCell>
              <TableCell><TableSortLabel
        active={sortColumn === 'Station'}
        direction={sortColumn === 'Station' ? sortOrder : 'asc'}
        onClick={() => handleSort('Station')}
      >
        Station
      </TableSortLabel></TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>PDF</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={7} />
            ) : displayedTravels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t) => (
              <TableRow key={t.id}>
                <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }}>{t.fullname || 'N/A'}</TableCell>
                <TableCell>{t.PositionDesignation}</TableCell>
                <TableCell>{t.Station}</TableCell>
                <TableCell>{t.Purpose || 'N/A'}</TableCell>
                <TableCell>{t.Destination}</TableCell>
                <TableCell>
                  {t.Attachment ? (
                    <a
                      href={`${baseURL}${t.Attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-navy underline hover:text-brand-accent transition-colors"
                    >
                      View
                    </a>
                  ) : 'None'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <IconButton onClick={() => setEditDialog({ open: true, data: { ...t } })}><EditIcon /></IconButton>

                    <IconButton onClick={() => setDeleteDialog({ open: true, id: t.id })}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!loading && displayedTravels.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <EmptyState message="No matching records found" hint="Try a different search term." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <TablePagination
        component="div"
        count={displayedTravels.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirm Delete?</DialogTitle>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, data: null })} maxWidth="sm" fullWidth>
  <DialogTitle>Edit Travel Details</DialogTitle>
  <TableContainer sx={{ p: 2 }}>
    {editDialog.data && (
      <>
        <TextField
          label="Position"
          fullWidth
          margin="normal"
          value={editDialog.data.PositionDesignation}
          onChange={(e) =>
            setEditDialog(prev => ({ ...prev, data: { ...prev.data, PositionDesignation: e.target.value } }))
          }
        />
        <TextField
          label="Station"
          fullWidth
          margin="normal"
          value={editDialog.data.Station}
          onChange={(e) =>
            setEditDialog(prev => ({ ...prev, data: { ...prev.data, Station: e.target.value } }))
          }
        />
        <TextField
          label="Destination"
          fullWidth
          margin="normal"
          value={editDialog.data.Destination}
          onChange={(e) =>
            setEditDialog(prev => ({ ...prev, data: { ...prev.data, Destination: e.target.value } }))
          }
          
        />
        <TextField
  label="Purpose"
  fullWidth
  margin="normal"
  value={editDialog.data.Purpose || ''}
  onChange={(e) =>
    setEditDialog(prev => ({ ...prev, data: { ...prev.data, Purpose: e.target.value } }))
  }
/>
<TextField
  label="Host"
  fullWidth
  margin="normal"
  value={editDialog.data.Host || ''}
  onChange={(e) =>
    setEditDialog(prev => ({ ...prev, data: { ...prev.data, Host: e.target.value } }))
  }
/>
<TextField
  label="Source of Fund"
  fullWidth
  margin="normal"
  disabled
  value="Local Fund"
  helperText="Always Local Fund for this office"
/>
<FormControl fullWidth margin="normal">
  <InputLabel id="area-select-label">Area</InputLabel>
  <Select
    labelId="area-select-label"
    value={editDialog.data.Area || ''}
    label="Area"
    onChange={(e) =>
      setEditDialog(prev => ({
        ...prev,
        data: { ...prev.data, Area: e.target.value }
      }))
    }
  >
    <MenuItem value="Division">Division</MenuItem>
    <MenuItem value="Region">Region</MenuItem>
    <MenuItem value="National">National</MenuItem>
    <MenuItem value="Abroad">Abroad</MenuItem>
  </Select>
</FormControl>

<TextField
  label="Date From"
  type="date"
  fullWidth
  margin="normal"
  value={editDialog.data.DatesFrom?.slice(0, 10) || ''}
  onChange={(e) =>
    setEditDialog(prev => ({ ...prev, data: { ...prev.data, DatesFrom: e.target.value } }))
  }
/>
<TextField
  label="Date To"
  type="date"
  fullWidth
  margin="normal"
  value={editDialog.data.DatesTo?.slice(0, 10) || ''}
  onChange={(e) =>
    setEditDialog(prev => ({ ...prev, data: { ...prev.data, DatesTo: e.target.value } }))
  }
/>

        <Button component="label" variant="outlined" sx={{ mt: 2 }}>
          Upload New PDF
          <input type="file" accept="application/pdf" hidden onChange={(e) => {
            setEditFile(e.target.files[0]);
            e.target.value = '';
          }} />
        </Button>
      </>
    )}
  </TableContainer>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button onClick={() => setEditDialog({ open: false, data: null })}>Cancel</Button>
    <Button onClick={async () => {
      try {
        const formData = new FormData();
        formData.append('PositionDesignation', editDialog.data.PositionDesignation);
formData.append('Station', editDialog.data.Station);
formData.append('Destination', editDialog.data.Destination);
formData.append('Purpose', editDialog.data.Purpose);
formData.append('Host', editDialog.data.Host);
formData.append('sof', 'Local Fund');
formData.append('Area', editDialog.data.Area);
formData.append('DatesFrom', editDialog.data.DatesFrom ? dayjs(editDialog.data.DatesFrom).format('YYYY-MM-DD') : '');
formData.append('DatesTo', editDialog.data.DatesTo ? dayjs(editDialog.data.DatesTo).format('YYYY-MM-DD') : '');
if (editFile) formData.append('attachment', editFile);

        await axios.put(`${baseURL}/api/travels/${editDialog.data.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setEditDialog({ open: false, data: null });
        setEditFile(null);
        fetchTravels();
      } catch (err) {
        console.error('Update failed:', err);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Failed to update travel info.',
        });
      }
    }} variant="contained">Save</Button>
  </DialogActions>
</Dialog>

    </Paper>
    </AppShell>
  );
};


export default AdminTravelTable;
