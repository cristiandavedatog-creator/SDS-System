// Shared AppShell sidebar nav-link sets, one per section, so the public and
// admin pages within a section can't drift out of sync with each other
// (each set below used to be copy-pasted into every page file separately).

export const TRAVEL_NAV_LINKS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Travels', path: '/travels' },
  { label: 'Statistics', path: '/statistics' },
];

export const APPOINTMENT_NAV_LINKS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Appointments', path: '/appointmentDetails' },
  { label: 'Statistics', path: '/appointmentStatistics' },
];

export const NOTICE_NAV_LINKS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Notices', path: '/orderDashboard' },
];

export const ADMIN_TRAVEL_NAV_LINKS = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Travel List', path: '/editTravel' },
  { label: 'Create Travel', path: '/createTravel' },
];

export const ADMIN_APPOINTMENT_NAV_LINKS = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Appointments', path: '/editAppointment' },
  { label: 'Add Appointments', path: '/createAppointment' },
];

export const ADMIN_NOTICE_NAV_LINKS = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Notices', path: '/editOrder' },
  { label: 'Create Notice', path: '/createOrder' },
];

export const ADMIN_EMPLOYEE_NAV_LINKS = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Employees', path: '/employees' },
];
