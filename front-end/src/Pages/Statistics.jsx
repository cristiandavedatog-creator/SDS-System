import React from 'react';
import LineGraph from '../Components/LineGraph';
import Overview from '../Components/Overview';
import Pie from '../Components/Pie';
import TravelStatsSummary from '../Components/TravelStatsSummary';
import AppShell from '../Components/AppShell';
import { TRAVEL_NAV_LINKS } from '../config/navLinks';

const Statistics = () => {
  return (
    <AppShell title="Travel Statistics" navLinks={TRAVEL_NAV_LINKS}>
      <div className="min-h-full flex justify-center">
        <div className="flex bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg justify-center p-4 sm:p-5 w-full max-w-[1400px] h-auto">
          <div className="flex flex-col gap-5 w-full items-center">
            <div>
              <Overview />
            </div>
            <div>
              <TravelStatsSummary />
            </div>
            <div className="flex flex-wrap gap-5 justify-center w-full">
              <LineGraph />
              <Pie />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Statistics;
