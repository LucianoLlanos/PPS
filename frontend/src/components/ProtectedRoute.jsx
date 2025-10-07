import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children, requiredRoleId }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRoleId && user && Number(user.idRol) !== Number(requiredRoleId)) {
    if (Number(user.idRol) === 3) return <Navigate to="/usuarios" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}
