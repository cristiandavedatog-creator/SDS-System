import React, { useState } from 'react';
import { TextField, InputAdornment, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ModeOfTravelIcon from '@mui/icons-material/ModeOfTravel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import TourIcon from '@mui/icons-material/Tour';
import CustomTable from '../Components/CustomTable';
import AppShell from '../Components/AppShell';
import useTravelStats from '../hooks/useTravelStats';
import { TRAVEL_STATUS_COLORS } from '../theme/travelStatus';
import { BRAND } from '../theme/theme';
import { TRAVEL_NAV_LINKS } from '../config/navLinks';

// Small, always-visible stat row — replaces the old click-through-to-see-each-count widget.
const STAT_TILES = [
  { key: 'total', label: 'Total', icon: <ModeOfTravelIcon fontSize="small" /> },
  { key: 'ongoing', label: 'Ongoing', icon: <AccessTimeIcon fontSize="small" /> },
  { key: 'upcoming', label: 'Upcoming', icon: <AirplaneTicketIcon fontSize="small" /> },
  { key: 'completed', label: 'Completed', icon: <TourIcon fontSize="small" /> },
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('total');
  const [pulse, setPulse] = useState({ key: '', nonce: 0 });
  const stats = useTravelStats();

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Clicking the active tile again clears the filter back to "total" (show everything).
  const handleTileClick = (key) => {
    setStatusFilter((prev) => (prev === key ? 'total' : key));
    setPulse({ key, nonce: Date.now() });
  };

  return (
    <AppShell title="Travel Dashboard" navLinks={TRAVEL_NAV_LINKS}>
      <section className="flex flex-col h-full w-full bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg p-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {STAT_TILES.map(({ key, label, icon }) => {
              const colors = TRAVEL_STATUS_COLORS[key];
              const active = statusFilter === key;
              const isPulsing = pulse.key === key;
              // The active tile rests at this scale permanently; the click "pop" below
              // animates around this same resting value so the two never fight each other.
              const baseScale = active ? 1.12 : 1;
              return (
                <Chip
                  // Changing the key on click forces React to remount just this chip,
                  // which restarts the CSS animation below even on repeated clicks.
                  key={`${key}-${isPulsing ? pulse.nonce : 'idle'}`}
                  icon={icon}
                  label={`${label}: ${stats[key]}`}
                  onClick={() => handleTileClick(key)}
                  variant={active ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 700,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transformOrigin: 'center',
                    zIndex: active ? 2 : 1,
                    color: active ? '#fff' : colors.text,
                    borderColor: colors.border,
                    backgroundColor: active ? colors.border : colors.bg,
                    boxShadow: active ? `0 4px 14px -2px ${colors.border}99` : 'none',
                    transform: isPulsing ? undefined : `scale(${baseScale})`,
                    transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.18s ease',
                    '&:hover': {
                      backgroundColor: active ? colors.border : colors.bg,
                    },
                    '& .MuiChip-icon': { color: active ? '#fff' : colors.text },
                    '@keyframes tilePop': {
                      '0%': { transform: `scale(${baseScale * 0.92})` },
                      '55%': { transform: `scale(${baseScale * 1.16}) rotate(-3deg)` },
                      '100%': { transform: `scale(${baseScale})` },
                    },
                    '@keyframes tileShine': {
                      '0%': { left: '-60%' },
                      '100%': { left: '130%' },
                    },
                    animation: isPulsing ? 'tilePop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-60%',
                      width: '45%',
                      height: '100%',
                      background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.9), transparent)',
                      transform: 'skewX(-20deg)',
                      pointerEvents: 'none',
                      animation: isPulsing ? 'tileShine 0.32s ease-out' : 'none',
                    },
                  }}
                />
              );
            })}
          </Stack>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: BRAND.hoverBg,
                },
              },
            }}
          />
        </div>

        <div className="flex-1 min-h-0 w-full">
          <CustomTable searchQuery={searchQuery} statusFilter={statusFilter} />
        </div>
      </section>
    </AppShell>
  );
};

export default Dashboard;
