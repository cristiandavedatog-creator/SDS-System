import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

// One shared stat-card shape for every dashboard tile, instead of each
// page drawing its own rectangle/circle with different radii and colors.
const StatCard = ({
  icon,
  label,
  count,
  colors,
  variant = 'rect',
  size = 200,
  onClick,
}) => {
  const lines = Array.isArray(label) ? label : [label];
  const isCircle = variant === 'circle';

  // Horizontal, low-height layout for sentence-length labels (e.g. "Total
  // Appointments in 2026") where the icon-stacked-above-text 'rect' shape
  // would need a very tall card just to avoid wrapping.
  if (variant === 'compact') {
    return (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minWidth: size,
          px: 2,
          py: 1.25,
          backgroundColor: colors.bg,
          borderLeft: `5px solid ${colors.border}`,
          borderRadius: 2,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : undefined,
        }}
      >
        {icon && React.cloneElement(icon, { sx: { fontSize: 30, color: colors.text, flexShrink: 0 } })}
        <Box sx={{ width: 120 }}>
          {lines.map((line, i) => (
            <Typography key={i} variant="caption" sx={{ display: 'block', lineHeight: 1.3, fontWeight: 600, color: colors.text }}>
              {line}
            </Typography>
          ))}
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text, lineHeight: 1.2 }}>
            {count}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        width: size,
        height: isCircle ? size : 'auto',
        minHeight: isCircle ? size : size * 0.9,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: isCircle ? 0 : 3,
        backgroundColor: colors.bg,
        border: isCircle ? `4px solid ${colors.border}` : 'none',
        borderLeft: isCircle ? `4px solid ${colors.border}` : `6px solid ${colors.border}`,
        borderRadius: isCircle ? '50%' : 3,
        overflow: isCircle ? 'hidden' : 'visible',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': onClick
          ? { transform: 'translateY(-2px)', boxShadow: 4 }
          : undefined,
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        {icon && React.cloneElement(icon, { sx: { fontSize: 50, color: colors.text } })}
        {lines.map((line, i) => (
          <Typography key={i} variant="h6">
            {line}
          </Typography>
        ))}
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: colors.text }}>
          {count}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;
