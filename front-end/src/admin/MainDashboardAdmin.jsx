import React from 'react';
import { Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, Box, CssBaseline, Button } from '@mui/material';
import { ModeOfTravel, Groups, Settings, BookmarkBorder, Badge, Logout } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../auth/authClient';

const drawerWidth = 240;

const navItems = [
  { text: 'Travels', icon: <ModeOfTravel />, to: '/createTravel' },
  { text: 'Appointments', icon: <Groups />, to: '/editAppointment' },
  { text: 'Notice', icon: <BookmarkBorder />, to: '/editOrder' },
  { text: 'Employees', icon: <Badge/>, to: '/employees' },

];

const MainDashboardAdmin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1e293b' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            DepEd Camarines Norte Admin
          </Typography>
          <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
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
