import React from 'react';
import { Chip } from '@mui/material';
import { TRAVEL_STATUS_COLORS } from '../../theme/travelStatus';
import { BRAND } from '../../theme/theme';

// Maps a status/label string to a colored Chip using the shared status
// palette, so tables/cards never fall back to color-only text.
const STATUS_STYLE = {
  total: TRAVEL_STATUS_COLORS.total,
  ongoing: TRAVEL_STATUS_COLORS.ongoing,
  upcoming: TRAVEL_STATUS_COLORS.upcoming,
  completed: TRAVEL_STATUS_COLORS.completed,
  success: TRAVEL_STATUS_COLORS.completed,
  error: TRAVEL_STATUS_COLORS.upcoming,
  info: TRAVEL_STATUS_COLORS.ongoing,
  warning: { bg: '#FFF4E5', border: BRAND.amber, text: BRAND.amber },
  neutral: { bg: BRAND.tableHead, border: BRAND.muted, text: '#475569' },
};

const StatusChip = ({ label, statusKey, size = 'small' }) => {
  const key = (statusKey || label || '').toString().toLowerCase();
  const colors = STATUS_STYLE[key] || STATUS_STYLE.neutral;

  return (
    <Chip
      label={label}
      size={size}
      variant="outlined"
      sx={{
        color: colors.text,
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    />
  );
};

export default StatusChip;
