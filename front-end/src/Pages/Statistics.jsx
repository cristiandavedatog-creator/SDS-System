import React, { useState } from 'react';
import LineGraph from '../Components/LineGraph';
import Overview from '../Components/Overview';
import Pie from '../Components/Pie';
import Header from '../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Travels', path: '/travels' },
  { label: 'Statistics', path: '/statistics' },
];

const Statistics = () => {
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedStation, setSelectedStation] = useState('All');

  return (
    <>
      <div className="w-full min-h-screen max-h-full flex flex-col gap-5 bg-white">
        {/* Header Section */}
        <Header title="Travel List" navLinks={navLinks} />


        {/* Main Content */}
        <div className="flex justify-center gap-5 px-5">
         
          <div className="flex bg-white/50 backdrop-blur-md border-green-500/30 border rounded-lg justify-center space-x-5 p-5 w-full h-auto">
            <div className="flex-col space-y-5">
              <div>
                <Overview />
              </div>
              <div className="flex gap-5">
                <LineGraph selectedPosition={selectedPosition} selectedStation={selectedStation} />
                <Pie />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Statistics;