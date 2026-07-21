import React from 'react';
import TravelInput from '../AdminComponents/TravelInput';
import BulkTravel from '../../Components/BulkTravel';
import Header from '../../Components/Header';

const CreateTravel = () => {
  return (
    <div className="w-full min-h-screen max-h-full flex-col flex justify-center items-center  bg-white">
      {/* Header Component */}
      <Header
        title="Create Travel"
        navLinks={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Travel List', path: '/editTravel' },
          { label: 'Create Travel', path: '/createTravel' },
        ]}
        showLogout
      />

      {/* Main Content */}
      <section className="bg-white/50 backdrop-blur-md rounded-lg justify-center space-x-5 flex px-10 py-5 mt-5 min-w-[900px] max-w-[95%] w-full">
       <div className='w-full flex flex-col items-center justify-center space-y-5'>
        
        <TravelInput />
  
       </div>

       
      </section>
    </div>
  );
};

export default CreateTravel;