import React from 'react'
import OrderTable from '../../Components/order_components/OrderTable'
import Header from '../../Components/Header';

const navLinks = [
  { label: 'Dashboard', path: '/' },
];

const OrderDashboard = () => {
  return (
    <div className="w-full h-screen flex flex-col  bg-white">
      <Header title="Notice List" navLinks={navLinks} />

      <div className="w-full max-h-full bg-white shadow-lg rounded-lg  overflow-y-auto items-center justify-center p-4 flex">
        <OrderTable />
      </div>
    </div>
  )
}

export default OrderDashboard