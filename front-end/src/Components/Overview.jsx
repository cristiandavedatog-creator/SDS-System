import React from 'react';
import {
  ModeOfTravel,
  AirplaneTicket,
  Tour,
  AccessTime
} from '@mui/icons-material';
import useTravelStats from '../hooks/useTravelStats';
import { TRAVEL_STATUS_COLORS } from '../theme/travelStatus';
import StatCard from './reusable_components/StatCard';

const cards = [
  { key: 'total', label: ['Total', 'Travels'], icon: <ModeOfTravel /> },
  { key: 'ongoing', label: ['Ongoing', 'Travels'], icon: <AccessTime /> },
  { key: 'upcoming', label: ['Upcoming', 'Travels'], icon: <AirplaneTicket /> },
  { key: 'completed', label: ['Completed', 'Travels'], icon: <Tour /> },
];

const Overview = () => {
  const stats = useTravelStats();

  return (
    <div className='flex justify-center items-center p-5 flex-wrap gap-5'>
      {cards.map(({ key, label, icon }) => (
        <StatCard
          key={key}
          icon={icon}
          label={label}
          count={stats[key]}
          colors={TRAVEL_STATUS_COLORS[key]}
        />
      ))}
    </div>
  );
};

export default Overview;
