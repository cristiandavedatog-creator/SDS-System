import React, { useState } from 'react';
import AppointmentTable from '../../Components/appointment_components/AppointmentTable';
import Header from '../../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Appointments', path: '/appointmentDetails' },
  { label: 'Statistics', path: '/appointmentStatistics' },
];

const AppointmentDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white">
      <Header title="Appointments List" navLinks={navLinks} />
      <div className="w-full h-full bg-white shadow-lg rounded-lg  overflow-y-auto">
        <AppointmentTable searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
    </div>
  );
};

export default AppointmentDetails;