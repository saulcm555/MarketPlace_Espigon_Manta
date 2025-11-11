/**
 * Protected Route Component
 * Protege rutas que requieren autenticación
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required (single role)
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check role if required (multiple roles)
  if (allowedRoles && !allowedRoles.includes(user?.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  // Authorized - render children
  return <>{children}</>;
};

export default ProtectedRoute;
