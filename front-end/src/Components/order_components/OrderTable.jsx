import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import EmptyState from '../reusable_components/EmptyState';
import TableSkeleton from '../reusable_components/TableSkeleton';

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(''); // empty = keep newest-first API order until the user picks a column
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [sortMode, setSortMode] = useState('uploaded'); // 'uploaded' = API order (newest uploaded first) | 'dateSigned' = Date Signed; only applies when no column header sort is active
  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios
      .get(`${baseURL}/api/orders`)
      .then((response) => {
        setOrders(response.data);
        setFilteredOrders(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load orders. Please try again later.');
        setLoading(false);
      });
  }, []);

  const handleRequestSort = (property) => {
    const isAscending = orderBy === property && order === 'asc';
    setOrder(isAscending ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    filterOrders(query, selectedDistrict);
  };

  const handleDistrictChange = (event) => {
    const district = event.target.value;
    setSelectedDistrict(district);
    filterOrders(searchQuery, district);
  };

  const filterOrders = (query, district) => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.name?.toLowerCase().includes(query) ||
        order.address?.toLowerCase().includes(query) ||
        order.position?.toLowerCase().includes(query) ||
        order.school_name?.toLowerCase().includes(query) ||
        order.district_name?.toLowerCase().includes(query);

      const matchesDistrict = district ? order.district_name === district : true;

      return matchesSearch && matchesDistrict;
    });

    setFilteredOrders(filtered);
  };

  const extractSurname = (fullName) => {
    const parts = fullName.split(' ');
    return parts[parts.length - 1]; // Assume the surname is the last word
  };

  const sortedOrders = orderBy
    ? filteredOrders.slice().sort((a, b) => {
        const compareA = (orderBy === 'surname' ? extractSurname(a.name) : a[orderBy] || '').toString().toLowerCase();
        const compareB = (orderBy === 'surname' ? extractSurname(b.name) : b[orderBy] || '').toString().toLowerCase();

        if (order === 'asc') {
          return compareA < compareB ? -1 : 1;
        }
        return compareA > compareB ? -1 : 1;
      })
    : sortMode === 'dateSigned'
    ? filteredOrders.slice().sort((a, b) => new Date(b.date_signed) - new Date(a.date_signed))
    : filteredOrders;

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ padding: 2, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Search Orders"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearch}
        />
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel>Districts</InputLabel>
          <Select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            label="Districts"
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {Array.from(new Set(orders.map((order) => order.district_name))).map(
              (district) => (
                <MenuItem key={district} value={district}>
                  {district}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel>Sort by</InputLabel>
          <Select value={sortMode} onChange={(e) => setSortMode(e.target.value)} label="Sort by">
            <MenuItem value="uploaded">Date Uploaded</MenuItem>
            <MenuItem value="dateSigned">Date Signed</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer sx={{ maxHeight: 550, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3 }}>
                <TableSortLabel
                  sx={{ fontWeight: 'bold' }}
                  active={orderBy === 'surname'}
                  direction={orderBy === 'surname' ? order : 'asc'}
                  onClick={() => handleRequestSort('surname')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  sx={{ fontWeight: 'bold' }}
                  active={orderBy === 'address'}
                  direction={orderBy === 'address' ? order : 'asc'}
                  onClick={() => handleRequestSort('address')}
                >
                  Address
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  sx={{ fontWeight: 'bold' }}
                  active={orderBy === 'position'}
                  direction={orderBy === 'position' ? order : 'asc'}
                  onClick={() => handleRequestSort('position')}
                >
                  Position
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  sx={{ fontWeight: 'bold' }}
                  active={orderBy === 'school_name'}
                  direction={orderBy === 'school_name' ? order : 'asc'}
                  onClick={() => handleRequestSort('school_name')}
                >
                  School
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  sx={{ fontWeight: 'bold' }}
                  active={orderBy === 'district_name'}
                  direction={orderBy === 'district_name' ? order : 'asc'}
                  onClick={() => handleRequestSort('district_name')}
                >
                  District
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date Signed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={6} />
            ) : sortedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'white' }}>
                  {order.pdf_path ? (
                    <a
                      href={`${baseURL}/${order.pdf_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-navy font-medium no-underline hover:underline"
                    >
                      {order.name}
                    </a>
                  ) : (
                    <span>{order.name}</span>
                  )}
                </TableCell>
                <TableCell>{order.address}</TableCell>
                <TableCell>{order.position}</TableCell>
                <TableCell>{order.school_name}</TableCell>
                <TableCell>{order.district_name}</TableCell>
                <TableCell>
                  {order.date_signed
                    ? new Date(order.date_signed).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
            {!loading && sortedOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <EmptyState message="No notices found" hint="Try adjusting your filters or search." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OrderTable;