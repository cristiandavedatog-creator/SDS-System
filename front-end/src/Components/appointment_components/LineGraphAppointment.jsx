import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { BRAND } from '../../theme/theme';

dayjs.extend(utc);
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const monthLabels = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const LineGraphAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025'); // Default to 2025
  const [yearOptions, setYearOptions] = useState([]);
  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${baseURL}/api/appointments`)
      .then((res) => {
        setAppointments(res.data);
        setLoading(false);

        // Extract unique years (starting from 2025 only)
        const years = Array.from(
          new Set(
            res.data
              .map((item) => {
                const date = dayjs(item.DateSigned).utc(); // Parse as UTC
                return date.isValid() ? date.year() : null;
              })
              .filter((year) => year >= 2025)
          )
        ).sort((a, b) => b - a); // Descending

        setYearOptions(years);
        if (years.includes(2025)) setSelectedYear('2025');
        else if (years.length > 0) setSelectedYear(years[0]);
      })
      .catch((err) => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const monthCounts = Array(12).fill(0); // 12 months

    appointments.forEach((item) => {
      if (!item.DateSigned) return;
      const date = dayjs(item.DateSigned).utc(); // Parse as UTC
      if (date.isValid() && date.year().toString() === selectedYear) {
        const monthIndex = date.month(); // 0 to 11
        monthCounts[monthIndex]++;
      }
    });

    setGraphData({
      labels: monthLabels,
      datasets: [
        {
          label: `Appointments in ${selectedYear}`,
          data: monthCounts,
          borderColor: BRAND.accent,
          backgroundColor: BRAND.chartFill,
          fill: true,
          tension: 0.3,
        },
      ],
    });
  }, [appointments, selectedYear]);

  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: 900,
        mx: 'auto',
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>Monthly Appointment Count</Typography>

        {/* Year Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {yearOptions.map((year, idx) => (
              <MenuItem key={idx} value={year.toString()}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : graphData ? (
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 200, sm: 230, md: 260 } }}>
          <Line data={graphData} options={{ responsive: true, maintainAspectRatio: false }} />
        </Box>
      ) : (
        <Typography>No data available.</Typography>
      )}
    </Paper>
  );
};

export default LineGraphAppointment;
