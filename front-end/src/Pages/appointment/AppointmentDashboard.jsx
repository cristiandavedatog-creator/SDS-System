import React, { useState } from 'react';
import AppointmentTable from '../../Components/appointment_components/AppointmentTable';
import AppShell from '../../Components/AppShell';
import { APPOINTMENT_NAV_LINKS } from '../../config/navLinks';

const AppointmentDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppShell title="Appointments List" navLinks={APPOINTMENT_NAV_LINKS}>
      <div className="w-full h-full bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg overflow-auto">
        <AppointmentTable searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
    </AppShell>
  );
};

export default AppointmentDetails;
