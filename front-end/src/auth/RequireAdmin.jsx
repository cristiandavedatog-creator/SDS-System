import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './authClient';

const RequireAdmin = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default RequireAdmin;
