import React from 'react';
import LineGraphAppointment from '../../Components/appointment_components/LineGraphAppointment';
import OverviewAppointment from '../../Components/appointment_components/OverviewAppointment';
import BarGraphAppointment from '../../Components/appointment_components/BarGraphAppoinment';
import AppointmentStatsSummary from '../../Components/appointment_components/AppointmentStatsSummary';
import AppShell from '../../Components/AppShell';
import { APPOINTMENT_NAV_LINKS } from '../../config/navLinks';

const AppointmentStatistics = () => {
  return (
    <AppShell title="Appointments Statistics" navLinks={APPOINTMENT_NAV_LINKS}>
      <div className="h-full flex justify-center">
        <div className="w-full max-w-[1600px] bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg flex flex-col gap-4 p-4 sm:p-5">
          {/* Overview Section */}
          <div className="w-full items-center flex justify-center sm:justify-start flex-wrap">
            <OverviewAppointment />
          </div>

          {/* Numeric totals: chosen year, chosen month, this week */}
          <div className="w-full">
            <AppointmentStatsSummary />
          </div>

          {/* Charts side by side on wide screens, stacked on narrow ones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            <LineGraphAppointment />
            <BarGraphAppointment />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AppointmentStatistics;
