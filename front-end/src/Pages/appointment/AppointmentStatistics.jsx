import React from 'react';
import LineGraphAppointment from '../../Components/appointment_components/LineGraphAppointment';
import OverviewAppointment from '../../Components/appointment_components/OverviewAppointment';
import BarGraphAppointment from '../../Components/appointment_components/BarGraphAppoinment';
import PieChartAppointment from '../../Components/appointment_components/PieChartAppointment';
import Header from '../../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Appointments', path: '/appointmentDetails' },
  { label: 'Statistics', path: '/appointmentStatistics' },
];

const AppointmentStatistics = () => {
  return (
    <div className="w-full  flex flex-col bg-white">
      {/* Header Section */}
      <Header title="Appointments Statistics" navLinks={navLinks} />
      {/* Content Section */}
      <div className="flex flex-col w-full  flex-grow p-3 ">
        {/* Overview Section */}
        <div className="w-full items-center flex justify-start px-10  ">
          <OverviewAppointment />
          
        </div>

      <div className='flex gap-5 justify-center flex-wrap w-full'>
       {/* Line Graph Section */}
        <div className="w-full max-w-[800px] md:max-w-[700px] sm:max-w-[500px]">
          <LineGraphAppointment />
        </div>

        {/* bar */}
        <div className="w-full max-w-[800px] md:max-w-[700px] sm:max-w-[500px]">
            <BarGraphAppointment />
        </div>
      </div>
       
      </div>
    </div>
  );
};

export default AppointmentStatistics;