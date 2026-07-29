import React, { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress } from '@mui/material';
import { Groups } from '@mui/icons-material';
import axios from 'axios';
import { TRAVEL_STATUS_COLORS } from '../../theme/travelStatus';

const OverviewAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${baseURL}/api/appointments`)
      .then(res => {
        setAppointments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  }, []);

  const totalAppointments = appointments.length;
  const colors = TRAVEL_STATUS_COLORS.total;

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>;
  }

  return (
    <Chip
      icon={<Groups fontSize="small" />}
      label={`Total Appointments: ${totalAppointments}`}
      variant="outlined"
      sx={{
        fontWeight: 600,
        color: colors.text,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        '& .MuiChip-icon': { color: colors.text },
      }}
    />
  );
};

export default OverviewAppointment;
