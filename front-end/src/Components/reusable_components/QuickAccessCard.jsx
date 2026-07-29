import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { BRAND } from '../../theme/theme';

const MotionBox = motion(Box);

// Pastel-tinted navigation card used on the public and admin hub pages.
// Two interaction modes, chosen by whether `layoutId` is passed:
//  - with `layoutId`: becomes part of a Framer Motion shared-layout
//    (container-transform) animation — used by the admin dashboard, which
//    owns a matching layoutId on the expanded overlay it morphs into.
//  - without it: a simple CSS scale/opacity "pop" driven by `active` — used
//    by the public dashboard's click-then-navigate flow.
const QuickAccessCard = ({ icon, tag, title, subtitle, onClick, colors, active = false, dimmed = false, layoutId }) => {
  const sharedSx = {
    borderRadius: '14px',
    p: 2.25,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minHeight: 128,
    width: 220,
    cursor: 'pointer',
    backgroundColor: colors.bg,
    color: colors.text,
    position: 'relative',
  };

  const content = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box
          sx={{
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            px: 1.1,
            py: 0.5,
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.6)',
          }}
        >
          {tag}
        </Box>
        <Box sx={{ fontSize: 28, display: 'flex' }}>{icon}</Box>
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '16px', color: BRAND.navy }}>{title}</Typography>
        <Typography sx={{ fontSize: '12px', opacity: 0.85 }}>{subtitle}</Typography>
      </Box>
    </>
  );

  if (layoutId) {
    return (
      <MotionBox
        layoutId={layoutId}
        onClick={onClick}
        role="link"
        tabIndex={dimmed ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onClick?.();
        }}
        animate={{ opacity: dimmed ? 0.4 : 1 }}
        whileHover={dimmed ? undefined : { y: -2 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        sx={{
          ...sharedSx,
          pointerEvents: dimmed ? 'none' : 'auto',
          boxShadow: '0 1px 2px rgba(22,35,61,0.06), 0 8px 24px -12px rgba(22,35,61,0.18)',
        }}
      >
        {content}
      </MotionBox>
    );
  }

  return (
    <Box
      onClick={onClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.();
      }}
      sx={{
        ...sharedSx,
        transformOrigin: 'center',
        transform: active ? 'scale(1.14)' : 'scale(1)',
        opacity: dimmed ? 0.45 : 1,
        zIndex: active ? 2 : 1,
        boxShadow: active
          ? '0 10px 22px -4px rgba(22,35,61,0.22), 0 22px 44px -16px rgba(22,35,61,0.38)'
          : '0 1px 2px rgba(22,35,61,0.06), 0 8px 24px -12px rgba(22,35,61,0.18)',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, opacity 0.3s ease',
        '&:hover': {
          transform: active ? 'scale(1.14)' : 'translateY(-2px)',
          boxShadow: '0 4px 10px rgba(22,35,61,0.12), 0 14px 28px -12px rgba(22,35,61,0.24)',
        },
      }}
    >
      {content}
    </Box>
  );
};

export default QuickAccessCard;
