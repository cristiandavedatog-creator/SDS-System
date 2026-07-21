import { Box, Typography } from '@mui/material';
import React from 'react';

const CustomBox = ({ text, number, icon, bgColor = '#ffffff', borderColor = '#2ECC71' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        padding: 2,
        transition: 'transform 0.3s ease', // Smooth transition for hover effect
        '&:hover': {
          transform: 'scale(1.1)', // Enlarges the box when hovered
        },
      }}
    >
      <Box
        sx={{
          width: 180,
          height: 180,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 2,
          backgroundColor: bgColor,
          border: `6px solid ${borderColor}`,
          borderRadius: '50%', // Makes the box circular
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h6">{text}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: borderColor }}>
          {number}
        </Typography>
        {icon && (
          <Box
            sx={{
              display: 'inline-flex', // Ensures the Box wraps tightly around the icon
              fontSize: 50,
              color: borderColor,
            }}
          >
            {icon}
          </Box>
        )}
        
      </Box>
    </Box>
  );
};

export default CustomBox;