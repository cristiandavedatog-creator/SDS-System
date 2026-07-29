import React from 'react';
import { Box, Typography } from '@mui/material';

// One label/value row in a details dialog; accepts either a plain `value`
// string or custom `children` (used for status chips / PDF links).
const DetailRow = ({ label, value, children }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Typography variant="body2" sx={{ width: 140, flexShrink: 0, color: 'text.secondary', fontWeight: 600 }}>
      {label}
    </Typography>
    {children || (
      <Typography variant="body2">{value || 'N/A'}</Typography>
    )}
  </Box>
);

export default DetailRow;
