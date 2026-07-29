import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickAccessCard from '../Components/reusable_components/QuickAccessCard';
import { ModeOfTravel, Groups, BookmarkBorder } from '@mui/icons-material';
import { TRAVEL_STATUS_COLORS } from '../theme/travelStatus';

const navItems = [
  { key: 'Travels', icon: <ModeOfTravel />, tag: 'Travels', title: 'Travel Authority', subtitle: 'Monitor travel orders and itineraries', to: '/travelsDashboard', colors: TRAVEL_STATUS_COLORS.ongoing },
  { key: 'Appointments', icon: <Groups />, tag: 'Appointments', title: 'Appointment Records', subtitle: 'Personnel appointment files', to: '/appointmentDetails', colors: TRAVEL_STATUS_COLORS.total },
  { key: 'Notice', icon: <BookmarkBorder />, tag: 'Notice', title: 'Office Notices', subtitle: 'Notices and memoranda', to: '/orderDashboard', colors: TRAVEL_STATUS_COLORS.completed },
];

// How long the clicked tile gets to pop and the board to tint before we
// actually navigate away — long enough to see it, short enough to not stall.
const NAVIGATE_DELAY_MS = 380;

const MainDashboard = () => {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState(null);

  const activeItem = navItems.find((item) => item.key === activeKey);
  // undefined (not a color) when nothing's active, so the bg-brand-paper
  // Tailwind class underneath keeps showing through instead of being fought.
  const boardTint = activeItem ? activeItem.colors.bg : undefined;

  // Resets automatically on the way back: this component remounts fresh
  // every time you navigate to the hub, so activeKey starts null again.
  const handleCardClick = (item) => {
    setActiveKey(item.key);
    setTimeout(() => navigate(item.to), NAVIGATE_DELAY_MS);
  };

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-brand-paper"
      style={{ backgroundColor: boardTint, transition: 'background-color 0.35s ease' }}
    >
      <div className="flex flex-col items-center justify-center w-full h-[80%] p-6">
        <div className="text-center mb-10 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-navy tracking-tight drop-shadow-sm">
            DepEd Camarines Norte
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 mt-3 max-w-xl mx-auto">
            For monitoring travels, managing appointments, and supporting SDS oversight.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 px-4">
          {navItems.map((item) => (
            <QuickAccessCard
              key={item.key}
              icon={item.icon}
              tag={item.tag}
              title={item.title}
              subtitle={item.subtitle}
              colors={item.colors}
              active={activeKey === item.key}
              dimmed={Boolean(activeKey) && activeKey !== item.key}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
