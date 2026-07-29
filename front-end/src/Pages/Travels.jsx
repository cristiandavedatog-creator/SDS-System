import React from 'react';
import TravelDetails from '../Components/TravelDetails';
import AppShell from '../Components/AppShell';
import { TRAVEL_NAV_LINKS } from '../config/navLinks';

const Travels = () => {
  return (
    <AppShell title="Travel List" navLinks={TRAVEL_NAV_LINKS}>
      <div className="h-full overflow-auto flex justify-center gap-3">
        <div className="flex-grow w-full max-w-[1400px]">
          <section className="bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg">
            <div className="w-full">
              <TravelDetails/>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default Travels;
