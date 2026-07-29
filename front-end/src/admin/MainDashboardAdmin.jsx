import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
// `motion` is used below as `<motion.div>`; no-unused-vars can't see JSX member-expression
// tags since this project has no eslint-plugin-react (no jsx-uses-vars rule).
import { motion, AnimatePresence, useIsPresent } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { ModeOfTravel, Groups, BookmarkBorder, Badge } from '@mui/icons-material';
import AppShell from '../Components/AppShell';
import QuickAccessCard from '../Components/reusable_components/QuickAccessCard';
import { BRAND } from '../theme/theme';
import { TRAVEL_STATUS_COLORS } from '../theme/travelStatus';
import { CreateTravelContent } from './travel/CreateTravel';
import { EditAppointmentContent } from './appointment/EditAppointment';
import { EditOrderContent } from './order_admin/EditOrder';
import { CreateEmployeeContent } from './employee/CreateEmployees';
import {
  ADMIN_TRAVEL_NAV_LINKS,
  ADMIN_APPOINTMENT_NAV_LINKS,
  ADMIN_NOTICE_NAV_LINKS,
  ADMIN_EMPLOYEE_NAV_LINKS,
} from '../config/navLinks';

// Each card's `Content` is the exact same component rendered at its own
// route (/createTravel, /editAppointment, /editOrder, /employees) — no
// logic/data-fetching/business rules are duplicated or altered here. Those
// routes still work standalone; this hub just offers a second way in.
// `navLinks` is that section's normal sidebar (List + Create) — shown while
// the card is expanded so you can still jump to the sibling view, since the
// expanded content no longer carries its own AppShell/sidebar with it.
// `contentPath` is which of that section's own nav links actually matches
// what `Content` renders — used to highlight the right sidebar item instead
// of the current URL (which never changes while the overlay is open).
const navItems = [
  { key: 'Travels', tag: 'Travels', subtitle: 'Create and manage travel orders', icon: <ModeOfTravel />, colors: TRAVEL_STATUS_COLORS.ongoing, Content: CreateTravelContent, navLinks: ADMIN_TRAVEL_NAV_LINKS, contentPath: '/createTravel' },
  { key: 'Appointments', tag: 'Appointments', subtitle: 'Manage appointment records', icon: <Groups />, colors: TRAVEL_STATUS_COLORS.total, Content: EditAppointmentContent, navLinks: ADMIN_APPOINTMENT_NAV_LINKS, contentPath: '/editAppointment' },
  { key: 'Notice', tag: 'Notice', subtitle: 'Manage office notices', icon: <BookmarkBorder />, colors: TRAVEL_STATUS_COLORS.completed, Content: EditOrderContent, navLinks: ADMIN_NOTICE_NAV_LINKS, contentPath: '/editOrder' },
  { key: 'Employees', tag: 'Employees', subtitle: 'Manage the SDO directory', icon: <Badge />, colors: TRAVEL_STATUS_COLORS.upcoming, Content: CreateEmployeeContent, navLinks: ADMIN_EMPLOYEE_NAV_LINKS, contentPath: '/employees' },
];

// Material's "emphasized" easing — the standard curve for container-transform.
const TRANSFORM_TRANSITION = { duration: 0.4, ease: [0.4, 0, 0.2, 1] };

// Renders the section's real (often heavy — 1000+ row tables) content only
// once the container has finished expanding AND only while this element is
// actually present (not mid-exit). `contentReady` alone isn't enough for the
// close direction: AnimatePresence keeps the *last rendered* tree mounted to
// animate its exit, so without checking `useIsPresent()` here, the moment
// you click close it would freeze-and-shrink the full table right along
// with the container — exactly the same jank as an unguarded open, just on
// the way out instead. Swapping to a lightweight placeholder the instant
// the exit starts keeps the shrink itself cheap in both directions.
const OverlayBody = ({ item, contentReady }) => {
  const isPresent = useIsPresent();
  const showContent = contentReady && isPresent;

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: showContent ? 2 : 0 }}>
      {showContent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <item.Content />
        </motion.div>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress sx={{ color: item.colors.border }} />
        </Box>
      )}
    </Box>
  );
};

const MainDashboardAdmin = () => {
  const [expandedKey, setExpandedKey] = useState(null);
  // The heavy page content (data-fetching tables) only mounts once the
  // container has finished morphing — mounting it mid-transform was the
  // main source of dropped frames, since a 1000+ row table was rendering
  // into the DOM at the same time the shape was still animating.
  const [contentReady, setContentReady] = useState(false);
  const activeItem = navItems.find((item) => item.key === expandedKey);

  useEffect(() => {
    setContentReady(false);
  }, [expandedKey]);

  // Two overrides needed because the URL never actually changes while the
  // overlay is open (it's always still '/admin'):
  //  - "Dashboard" pointing at '/admin' would otherwise be a no-op navigate
  //    (already there), so it's rewired to close the overlay directly.
  //  - highlighting must follow which link matches the *content* actually
  //    shown, not location.pathname (which would always say "Dashboard").
  const sidebarNavLinks = activeItem
    ? activeItem.navLinks.map((link) => ({
        ...link,
        active: link.path === activeItem.contentPath,
        onClick: link.path === '/admin' ? () => setExpandedKey(null) : undefined,
      }))
    : [];

  return (
    <AppShell navLinks={sidebarNavLinks} showLogout>
      {/* Bounds for the overlay: it fills this box, not the whole viewport,
          so the sidebar stays put and only the dashboard content morphs. */}
      <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND.navy }}>
            Welcome to the Admin Dashboard
          </Typography>
          <Typography sx={{ mt: 1, mb: 4, color: BRAND.muted }}>
            Monitor travels, manage appointments, and aid the SDS needs.
          </Typography>

          {/* Quick access */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 2, sm: 3 } }}>
            {navItems.map((item) => (
              // The expanded card's grid slot renders an invisible spacer
              // instead of the real card — the card "is" the overlay while
              // open, so there's only ever one element per layoutId at a time.
              expandedKey === item.key ? (
                <Box key={item.key} sx={{ width: 220, minHeight: 128 }} />
              ) : (
                <QuickAccessCard
                  key={item.key}
                  layoutId={`dashboard-card-${item.key}`}
                  icon={item.icon}
                  tag={item.tag}
                  title={item.key}
                  subtitle={item.subtitle}
                  colors={item.colors}
                  dimmed={Boolean(expandedKey)}
                  onClick={() => setExpandedKey(item.key)}
                />
              )
            ))}
          </Box>
        </Box>

        {/* Expanded container — same layoutId as the card it grew from, so
            Framer Motion morphs between the two automatically in both
            directions (expand on open, shrink back on close/interrupt).
            Use the sidebar's Dashboard link to go back. */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              key={activeItem.key}
              layoutId={`dashboard-card-${activeItem.key}`}
              transition={TRANSFORM_TRANSITION}
              onLayoutAnimationComplete={() => setContentReady(true)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 20px 50px -12px rgba(15,23,42,0.35)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Colored header carries the source card's identity (its own
                  pastel color + icon) forward into the expanded view. */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1.5,
                  flexShrink: 0,
                  backgroundColor: activeItem.colors.bg,
                  color: activeItem.colors.text,
                }}
              >
                <Box sx={{ fontSize: 22, display: 'flex' }}>{activeItem.icon}</Box>
                <Typography sx={{ fontWeight: 800 }}>{activeItem.key}</Typography>
              </Box>

              {/* Content cross-fades in only once mounted, and only mounts
                  once the shape animation has settled — see OverlayBody for
                  why the close direction needs its own guard too. */}
              <OverlayBody item={activeItem} contentReady={contentReady} />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </AppShell>
  );
};

export default MainDashboardAdmin;
