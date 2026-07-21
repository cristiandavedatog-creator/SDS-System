import React from 'react';
import TravelDetails from '../Components/TravelDetails';
import Header from '../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Travels', path: '/travels' },
  { label: 'Statistics', path: '/statistics' },
];

const Travels = () => {
  return (
    <>
      <main className="w-full min-h-screen flex flex-col bg-white">
        {/* Header Section */}
        <Header title="Travel List" navLinks={navLinks} />
        {/* Main Content */}
        <div className="flex  justify-center gap-3 mt-3 px-5">
          {/* Sidebar */}
          

          {/* Content Section */}
          <div className="flex-grow min-w-[1000px] w-full">
            <section className="bg-white/50 backdrop-blur-md border-green-500/30 border rounded-lg ">
              <div className="w-full">
                <TravelDetails/>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default Travels;