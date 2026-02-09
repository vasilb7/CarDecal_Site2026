
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = i18n.language.split("-")[0] || "bg";

  if (loading) {
    return null; // Return nothing while loading to hide existence
  }

  // If not admin or not logged in, act as if the page doesn't exist
  if (!user || !isAdmin) {
    return <Navigate to={`/${currentLang}`} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
