import React from 'react';
import { Box, CssBaseline, Typography } from '@mui/material';
import { ModeOfTravel, Groups, BookmarkBorder, Badge } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Header from '../Components/Header';

const navItems = [
  { text: 'Travels', icon: <ModeOfTravel />, to: '/createTravel' },
  { text: 'Appointments', icon: <Groups />, to: '/editAppointment' },
  { text: 'Notice', icon: <BookmarkBorder />, to: '/editOrder' },
  { text: 'Employees', icon: <Badge/>, to: '/employees' },

];

const MainDashboardAdmin = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Top App Bar */}
      <Header title="DepEd Camarines Norte Admin" navLinks={[]} showLogout />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `
            radial-gradient(circle at 20% 30%, #e0f7fa, transparent 60%),
            radial-gradient(circle at 80% 40%, #ede7f6, transparent 70%),
            radial-gradient(circle at 50% 80%, #fce4ec, transparent 60%)`,
          backgroundColor: '#f8fafc',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Welcome to the Admin Dashboard
        </Typography>
        <Typography sx={{ mt: 1, mb: 4, color: '#64748b' }}>
          Monitor travels, manage appointments, and aid the SDS needs.
        </Typography>

        {/* Centered Navigation */}
        <Box sx={{ display: 'flex', gap: 6 }}>
          {navItems.map((item) => (
            <Box
              key={item.text}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                borderRadius: 2,
                boxShadow: 3,
                backgroundColor: '#fff',
                width: 180,
                height: 180,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 6,
                },
              }}
              component={Link}
              to={item.to}
            >
              <Box sx={{ fontSize: 40, color: '#1e293b' }}>{item.icon}</Box>
              <Typography sx={{ fontSize: '16px', color: '#1e293b', fontWeight: 'bold' }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MainDashboardAdmin;
