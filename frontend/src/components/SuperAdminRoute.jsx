import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

export default function SuperAdminRoute({ children }) {
  const { isSuperAdmin } = useRole();
  return isSuperAdmin ? children : <Navigate to="/dashboard" replace />;
}
