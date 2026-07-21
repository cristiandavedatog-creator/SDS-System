import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  ModeOfTravel,
  AirplaneTicket,
  Tour,
  AccessTime
} from '@mui/icons-material';
import useTravelStats from '../hooks/useTravelStats';
import { TRAVEL_STATUS_COLORS } from '../theme/travelStatus';

const cards = [
  { key: 'total', label: ['Total', 'Travels'], icon: ModeOfTravel },
  { key: 'ongoing', label: ['Ongoing', 'Travels'], icon: AccessTime },
  { key: 'upcoming', label: ['Upcoming', 'Travels'], icon: AirplaneTicket },
  { key: 'completed', label: ['Completed', 'Travels'], icon: Tour },
];

const Overview = () => {
  const stats = useTravelStats();

  return (
    <div className='flex justify-center items-center p-5 flex-wrap gap-5'>
      {cards.map(({ key, label, icon: Icon }) => {
        const colors = TRAVEL_STATUS_COLORS[key];
        return (
          <Box key={key}>
            <Card sx={{
              width: 200,
              height: 180,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingX: 5,
              backgroundColor: colors.bg,
              borderLeft: `6px solid ${colors.border}`,
            }}>
              <CardContent>
                <Icon sx={{ fontSize: 50, color: colors.text }} />
                <Typography variant="h6">{label[0]}</Typography>
                <Typography variant="h6">{label[1]}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: colors.text }}>
                  {stats[key]}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      })}
    </div>
  );
};

export default Overview;
