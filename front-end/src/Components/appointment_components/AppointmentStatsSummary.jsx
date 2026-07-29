import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarMonth, Event, DateRange } from '@mui/icons-material';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import StatCard from '../reusable_components/StatCard';
import { TRAVEL_STATUS_COLORS } from '../../theme/travelStatus';

const YEARS = [2023, 2024, 2025, 2026];
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString('default', { month: 'long' })
);

// Numeric counterpart to the appointment charts: a chosen year's total,
// a chosen month's total, and the current week's total, as plain numbers.
const AppointmentStatsSummary = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [stats, setStats] = useState({ yearTotal: 0, monthTotal: 0, weekTotal: 0 });
  const baseURL = import.meta.env.VITE_API_URL;

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/api/appointments/stats`, {
        params: { year: selectedYear, month: selectedMonth },
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch appointment stats:', err);
    }
  }, [baseURL, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Box className="flex gap-4 flex-wrap justify-center">
        <FormControl size="small">
          <InputLabel>Year</InputLabel>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} label="Year">
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Month</InputLabel>
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} label="Month">
            {MONTH_NAMES.map((name, i) => (
              <MenuItem key={name} value={i + 1}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <div className="flex justify-center items-center flex-wrap gap-5">
        <StatCard
          variant="compact"
          size={190}
          icon={<CalendarMonth />}
          label={['Total Appointments', `in ${selectedYear}`]}
          count={stats.yearTotal}
          colors={TRAVEL_STATUS_COLORS.total}
        />
        <StatCard
          variant="compact"
          size={190}
          icon={<Event />}
          label={['Total Appointments', `in ${MONTH_NAMES[selectedMonth - 1]}`]}
          count={stats.monthTotal}
          colors={TRAVEL_STATUS_COLORS.completed}
        />
        <StatCard
          variant="compact"
          size={190}
          icon={<DateRange />}
          label={['Appointments', 'This Week']}
          count={stats.weekTotal}
          colors={TRAVEL_STATUS_COLORS.ongoing}
        />
      </div>
    </div>
  );
};

export default AppointmentStatsSummary;
