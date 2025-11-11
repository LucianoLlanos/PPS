import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children, requiredRoleId }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (requiredRoleId && user) {
    const userRoleId = Number(user.idRol);
    
    // Soporte para array de roles
    const allowedRoles = Array.isArray(requiredRoleId) ? requiredRoleId : [requiredRoleId];
    const hasPermission = allowedRoles.some(roleId => userRoleId === Number(roleId));
    
    if (!hasPermission) {
      // Redirigir según el rol del usuario
      if (userRoleId === 3) return <Navigate to="/usuarios" replace />;
      if (userRoleId === 2) return <Navigate to="/vendedor" replace />;
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
}
