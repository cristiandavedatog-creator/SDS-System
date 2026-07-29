import React, { useState, useRef } from 'react';
import {
  Button,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress
} from '@mui/material';
import * as XLSX from 'xlsx';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { BRAND } from '../../theme/theme';

const BulkAppointmentUpload = () => {
  const fileInputRef = useRef();
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseURL = import.meta.env.VITE_API_URL;

 const formatDate = (value) => {
  if (!value) return null;

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }

  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD') : null;
};

  const validateColumns = (rows) => {
    const requiredColumns = [
      'Name',
      'PositionTitle',
      'SchoolOffice',
      'District',
      'StatusOfAppointment',
      'NatureAppointment',
      'ItemNo',
      'DateSigned',
      'remarks'
    ];
    const missingColumns = requiredColumns.filter(
      (col) => !rows[0] || !Object.prototype.hasOwnProperty.call(rows[0], col)
    );
    return missingColumns;
  };

  const parseFile = async (file) => {
    setLoading(true); // Show loading indicator
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      let rows = [];

      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(data);
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        rows = lines.slice(1).map((line) => {
          const values = line.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim() || '';
            return obj;
          }, {});
        });
      } else {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      }

      const missingColumns = validateColumns(rows);
      if (missingColumns.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Columns',
          text: `Missing mandatory columns: ${missingColumns.join(', ')}`,
        });
        setLoading(false); // Hide loading indicator
        return;
      }

      const formattedRows = rows.map((row) => ({
        Name: row.Name || '',
        PositionTitle: row.PositionTitle || '',
        SchoolOffice: row.SchoolOffice || '',
        District: row.District || '',
        StatusOfAppointment: row.StatusOfAppointment || '',
        NatureAppointment: row.NatureAppointment || '',
        ItemNo: row.ItemNo || '',
        DateSigned: formatDate(row.DateSigned),
        remarks: row.remarks === '' ? null : row.remarks // Convert empty remarks to NULL
      }));

      setParsedData(formattedRows);
      setPreviewData(formattedRows.slice(0, 5));
      setOpenDialog(true);
      setLoading(false); // Hide loading indicator
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseFile(file);
    }
    e.target.value = '';
  };

  const cancelFileSelection = () => {
    setParsedData([]);
    setPreviewData([]);
    setOpenDialog(false);
  };

  const handleUpdate = async () => {
    if (!parsedData.length) return;
    setLoading(true);
    try {
      const url = `${baseURL}/api/appointments/bulk-update`;

      const res = await axios.post(url, parsedData, {
        headers: { 'Content-Type': 'application/json' }
      });

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: res.data.message || 'Update successful!',
      });
    } catch (err) {
      console.error('Update failed:', err);

      if (err.response?.status === 400) {
        Swal.fire({
          icon: 'error',
          title: 'Bad Request',
          text: 'Check your file formatting.',
        });
      } else if (err.response?.status === 500) {
        Swal.fire({
          icon: 'error',
          title: 'Server Error',
          text: 'Internal server error: Please contact support.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Unknown error.',
        });
      }
    } finally {
      setLoading(false);
      setOpenDialog(false);
      setParsedData([]);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} mt={2}>
        <Button
          variant="contained"
          onClick={() => fileInputRef.current.click()}
        >
          Upload File
        </Button>
      </Stack>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Review Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !loading && setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Review Update Data</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {parsedData.length} records found. Here's a preview of the first{' '}
            {previewData.length}:
          </DialogContentText>
          <Box mt={2} maxHeight="300px" overflow="auto" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  {[
                    'Name',
                    'PositionTitle',
                    'SchoolOffice',
                    'District',
                    'StatusOfAppointment',
                    'NatureAppointment',
                    'ItemNo',
                    'DateSigned',
                    'remarks'
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-200"
                      style={{ backgroundColor: BRAND.tableHead }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-200 even:bg-slate-50 hover:bg-sky-50/60 transition-colors">
                    <td className="px-4 py-2 text-sm">{row.Name}</td>
                    <td className="px-4 py-2 text-sm">{row.PositionTitle}</td>
                    <td className="px-4 py-2 text-sm">{row.SchoolOffice}</td>
                    <td className="px-4 py-2 text-sm">{row.District}</td>
                    <td className="px-4 py-2 text-sm">
                      {row.StatusOfAppointment}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {row.NatureAppointment}
                    </td>
                    <td className="px-4 py-2 text-sm">{row.ItemNo}</td>
                    <td className="px-4 py-2 text-sm">{row.DateSigned}</td>
                    <td className="px-4 py-2 text-sm">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelFileSelection} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkAppointmentUpload;