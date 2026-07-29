import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LogIn from './Pages/LogIn';
import Travels from './Pages/Travels';
import Dashboard from './Pages/Dashboard';
import Statistics from './Pages/Statistics';
import MainDashboard from './Pages/MainDashboard';
import CreateAppointment from './admin/appointment/CreateAppointment';
import EditAppointment from './admin/appointment/EditAppointment';
import AppointmentStatistics from './Pages/appointment/AppointmentStatistics';
import AppointmentDetails from './Pages/appointment/AppointmentDashboard';
import CreateTravel from './admin/travel/CreateTravel';
import MainDashboardAdmin from './admin/MainDashboardAdmin';
import EditTravel from './admin/travel/EditTravel';
import CreateOrder from './admin/order_admin/CreateOrder';
import OrderDashboard from './Pages/order/OrderDashboard';
import EditOrder from './admin/order_admin/EditOrder';
import CreateEmployee from './admin/employee/CreateEmployees';
import RequireAdmin from './auth/RequireAdmin';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <Routes>
            <Route path="/travelsDashboard" element={<Dashboard />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/travels" element={<Travels />} />
            <Route path="/login" element={<LogIn />} />

            {/* admin travel */}
            <Route path="/createTravel" element={<RequireAdmin><CreateTravel /></RequireAdmin>} />
            <Route path="/editTravel" element={<RequireAdmin><EditTravel /></RequireAdmin>} />
            <Route path="/" element={<MainDashboard />} />

            {/* SDS appointment system */}
            <Route path="/appointmentDetails" element={<AppointmentDetails />} />
            <Route path="/appointmentStatistics" element={<AppointmentStatistics />} />

            {/* SDS order system */}
            <Route path="/orderDashboard" element={<OrderDashboard />} />
            <Route path="/editOrder" element={<RequireAdmin><EditOrder /></RequireAdmin>} />

            {/* admin appointment system */}
            <Route path="/createAppointment" element={<RequireAdmin><CreateAppointment /></RequireAdmin>} />
            <Route path="/editAppointment" element={<RequireAdmin><EditAppointment /></RequireAdmin>} />

            {/* admin main dashboard */}
            <Route path="/admin" element={<RequireAdmin><MainDashboardAdmin /></RequireAdmin>} />

            {/* admin order system */}
            <Route path="/createOrder" element={<RequireAdmin><CreateOrder /></RequireAdmin>} />
            <Route path="/employees" element={<RequireAdmin><CreateEmployee /></RequireAdmin>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};  

export default App;
