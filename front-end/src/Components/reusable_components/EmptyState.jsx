import React from 'react';
import { Box, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { BRAND } from '../../theme/theme';

// Friendlier "nothing here" placeholder for table bodies — replaces bare
// bold text with an icon + a primary line and an optional muted hint.
const EmptyState = ({ message = 'No records found', hint, icon }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75, py: 5 }}>
    <Box sx={{ fontSize: 36, display: 'flex', color: BRAND.line }}>
      {icon || <InboxOutlinedIcon fontSize="inherit" />}
    </Box>
    <Typography sx={{ fontWeight: 600, color: BRAND.navy }}>{message}</Typography>
    {hint && (
      <Typography variant="body2" sx={{ color: BRAND.muted }}>{hint}</Typography>
    )}
  </Box>
);

export default EmptyState;
