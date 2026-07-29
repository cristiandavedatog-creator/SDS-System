import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button,
  Autocomplete, TableSortLabel,
  InputAdornment, Tooltip, Link,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Edit, Delete, Search as SearchIcon, Save as SaveIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import AppShell from '../../Components/AppShell';
import StatusChip from '../../Components/reusable_components/StatusChip';
import EmptyState from '../../Components/reusable_components/EmptyState';
import TableSkeleton from '../../Components/reusable_components/TableSkeleton';
import { ADMIN_NOTICE_NAV_LINKS } from '../../config/navLinks';
import { startsWithFirstFilter } from '../../utils/autocompleteFilters';

// Exported separately so the admin dashboard can render this content inline
// (inside its container-transform overlay) without a nested AppShell. All
// state/logic/data-fetching below is unchanged from the original component.
export const EditOrderContent = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const baseURL = import.meta.env.VITE_API_URL;

  const API = `${baseURL}/api`;

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders`);
      setOrders(res.data);
      setFilteredOrders(res.data); // Initialize filtered orders
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all schools with their districts
  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${API}/schools-w-district`);
      setSchools(res.data);
    } catch (err) {
      console.error('Error fetching schools and districts:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSchools();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredOrders(
      orders.filter((order) =>
        order.name?.toLowerCase().includes(term)
      )
    );
  };

 const handleEditClick = (row) => {
  setEditing({
    ...row,
    school: row.school_id,
    date_signed: row.date_signed
      ? new Date(row.date_signed).toLocaleDateString('en-CA') // Format as YYYY-MM-DD in local time
      : '',
  });
  setOpen(true);
};

  const handleDelete = async (idorder) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API}/orders/${idorder}`);
        fetchOrders();
      } catch (err) {
        console.error('Error deleting order:', err);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Failed to delete the order. Please try again.',
        });
      }
    }
  };

  const handleUpdate = async () => {
    const formData = new FormData();

    // Map front-end fields to back-end fields
    const fieldMap = {
      name: 'name',
      address: 'address',
      position: 'position',
      school: 'school', // Send school ID to the backend
      date_signed: 'date_signed',
    };

    // Append fields to formData
    for (let key in fieldMap) {
      const frontendValue = editing[key];

      // Format date fields to YYYY-MM-DD
      if (key === 'date_signed') {
        formData.append(fieldMap[key], frontendValue ? frontendValue.slice(0, 10) : '');
      } else {
        formData.append(fieldMap[key], frontendValue || '');
      }
    }

    // Attach PDF if replaced
    if (editing.pdf) {
      formData.append('pdf', editing.pdf); // Attach if replaced
    }

    try {
      // Send update request to the backend
      await axios.put(`${API}/orders/${editing.idorder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOpen(false); // Close modal/dialog
      fetchOrders(); // Refresh orders list
    } catch (err) {
      console.error('Update failed:', err); // Log error
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Please check the data and try again.',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

   const [sortColumn, setSortColumn] = useState('');
const [sortOrder, setSortOrder] = useState('asc');
  const [sortMode, setSortMode] = useState('uploaded'); // 'uploaded' = API order (newest uploaded first) | 'dateSigned' = Date Signed; only applies when no column header sort is active

// Sorting logic
const handleSort = (column) => {
  const isAsc = sortColumn === column && sortOrder === 'asc';
  setSortOrder(isAsc ? 'desc' : 'asc');
  setSortColumn(column);

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let valueA = a[column] || '';
    let valueB = b[column] || '';
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

  setFilteredOrders(sortedOrders);
};

  // Only kicks in when no column header sort is active, so clicking a column header still works as before.
  const displayedOrders = sortColumn
    ? filteredOrders
    : sortMode === 'dateSigned'
    ? [...filteredOrders].sort((a, b) => new Date(b.date_signed) - new Date(a.date_signed))
    : filteredOrders;

  return (
      <Box sx={{ maxWidth: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 2 }}>
        {/* Search + Sort */}
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

        {/* Table Container centered */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <TableContainer component={Paper} sx={{ maxHeight: 500, width: '100%', maxWidth: 1800 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3 }}>
      <TableSortLabel
        active={sortColumn === 'name'}
        direction={sortColumn === 'name' ? sortOrder : 'asc'}
        onClick={() => handleSort('name')}
      >
        Name
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortColumn === 'address'}
        direction={sortColumn === 'address' ? sortOrder : 'asc'}
        onClick={() => handleSort('address')}
      >
        Address
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortColumn === 'position'}
        direction={sortColumn === 'position' ? sortOrder : 'asc'}
        onClick={() => handleSort('position')}
      >
        Position
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortColumn === 'school_name'}
        direction={sortColumn === 'school_name' ? sortOrder : 'asc'}
        onClick={() => handleSort('school_name')}
      >
        School
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortColumn === 'district_name'}
        direction={sortColumn === 'district_name' ? sortOrder : 'asc'}
        onClick={() => handleSort('district_name')}
      >
        District
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortColumn === 'date_signed'}
        direction={sortColumn === 'date_signed' ? sortOrder : 'asc'}
        onClick={() => handleSort('date_signed')}
      >
        Date Signed
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortColumn === 'pdf_path'}
        direction={sortColumn === 'pdf_path' ? sortOrder : 'asc'}
        onClick={() => handleSort('pdf_path')}
      >
        PDF
      </TableSortLabel>
    </TableCell>
    <TableCell>
      Actions
    </TableCell>
  </TableRow>
</TableHead>

              <TableBody>
                {loading ? (
                  <TableSkeleton columns={8} />
                ) : displayedOrders.map((row) => (
                  <TableRow key={row.idorder}>
                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }}>{row.name}</TableCell>
                    <TableCell>{row.address}</TableCell>
                    <TableCell>{row.position}</TableCell>
                    <TableCell>{row.school_name}</TableCell>
                    <TableCell>{row.district_name}</TableCell>
                   <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {row.date_signed && !isNaN(new Date(row.date_signed))
                                          ? (() => {
                                              const date = new Date(row.date_signed);
                                              const month = date.toLocaleString('en-US', { month: 'short' }); // e.g. "Jul"
                                              const day = String(date.getDate()).padStart(2, '0');             // e.g. "30"
                                              const year = date.getFullYear();                                 // e.g. "2025"
                                              return `${month}-${day}-${year}`;
                                            })()
                                          : ''}
                                      </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusChip
                          label={row.pdf_path ? 'Available' : 'Missing'}
                          statusKey={row.pdf_path ? 'completed' : 'upcoming'}
                        />
                        {row.pdf_path && (
                          <Link
                            href={`${baseURL}/${row.pdf_path}`}
                            target="_blank"
                            rel="noreferrer"
                            color="primary"
                            underline="hover"
                          >
                            View
                          </Link>
                        )}
                      </Box>
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
                          onClick={() => handleDelete(row.idorder)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && displayedOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <EmptyState message="No notices found" hint="Try a different search term." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Edit Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Notice</DialogTitle>
          <DialogContent>
            {['name', 'address', 'position'].map((field) => (
              <TextField
                key={field}
                margin="dense"
                name={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                type="text"
                fullWidth
                value={editing?.[field] || ''}
                onChange={handleChange}
              />
            ))}

            {/* School Dropdown */}
            <Autocomplete
  options={schools}
  getOptionLabel={(option) => `${option.school_name} (${option.district_name})`}
  filterOptions={startsWithFirstFilter((option) => option.school_name)}
  value={
    schools.find((school) => school.school_id === editing?.school) || null
  }
  onChange={(event, newValue) => {
    setEditing((prev) => ({
      ...prev,
      school: newValue ? newValue.school_id : '',
    }));
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="School"
      margin="dense"
      fullWidth
    />
  )}
/>
            <TextField
  margin="dense"
  name="date_signed"
  label="Date Signed"
  type="date"
  fullWidth
  value={
    editing?.date_signed && !isNaN(new Date(editing.date_signed))
      ? new Date(editing.date_signed).toISOString().slice(0, 10)
      : ''
  }
  onChange={handleChange}
  InputLabelProps={{ shrink: true }}
/>

            {/* PDF Upload */}
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ mt: 2 }}>
              Upload PDF
              <input
                type="file"
                accept="application/pdf"
                hidden
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
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleUpdate}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

const EditOrder = () => (
  <AppShell title="Manage Notices" navLinks={ADMIN_NOTICE_NAV_LINKS} showLogout>
    <EditOrderContent />
  </AppShell>
);

export default EditOrder;