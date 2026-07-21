import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../auth/authClient';

const Header = ({ text, title, navLinks = [], showLogout = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1e293b', width: '100%' }}>
      <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title || text}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                color="inherit"
                onClick={() => navigate(link.path)}
                sx={{
                  borderRadius: 0,
                  borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
                  fontWeight: active ? 700 : 400,
                  opacity: active ? 1 : 0.85,
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Box>
        {showLogout && (
          <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
            Log out
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
