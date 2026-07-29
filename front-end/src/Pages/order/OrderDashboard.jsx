import React from 'react'
import OrderTable from '../../Components/order_components/OrderTable'
import AppShell from '../../Components/AppShell';
import { NOTICE_NAV_LINKS } from '../../config/navLinks';

const OrderDashboard = () => {
  return (
    <AppShell title="Notice List" navLinks={NOTICE_NAV_LINKS}>
      <div className="w-full h-full bg-white/50 backdrop-blur-md border border-brand-navy/20 rounded-lg overflow-auto p-4">
        <OrderTable />
      </div>
    </AppShell>
  )
}

export default OrderDashboard
