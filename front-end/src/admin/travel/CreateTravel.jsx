import React from 'react';
import { Box, Typography } from '@mui/material';
import TravelInput from '../AdminComponents/TravelInput';
import BulkTravel from '../../Components/BulkTravel';
import AppShell from '../../Components/AppShell';
import { ADMIN_TRAVEL_NAV_LINKS } from '../../config/navLinks';

// Exported separately so the admin dashboard can render this content inline
// (inside its container-transform overlay) without a nested AppShell.
export const CreateTravelContent = () => (
  <div className="w-full flex-col flex justify-center items-center">
    <section className="bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg justify-center flex px-4 sm:px-6 md:px-10 py-5 max-w-[95%] w-full">
     <div className='w-full flex flex-col items-center justify-center space-y-5'>

      <TravelInput />

      <Box
        sx={{
          mt: 4,
          width: '100%',
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Bulk Insertion and Update
        </Typography>
        <BulkTravel />
      </Box>

     </div>
    </section>
  </div>
);

const CreateTravel = () => {
  return (
    <AppShell title="Create Travel" navLinks={ADMIN_TRAVEL_NAV_LINKS} showLogout>
      <CreateTravelContent />
    </AppShell>
  );
};

export default CreateTravel;
