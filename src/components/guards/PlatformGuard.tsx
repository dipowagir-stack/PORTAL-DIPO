import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AccessDenied from '../../pages/errors/AccessDenied';

export const PlatformGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (!user || !profile) {
    return <Navigate to="/platform/login" replace />;
  }
  
  const cleanEmail = (user.email || '').toLowerCase().trim();
  const isPlatformAdmin = cleanEmail === 'romeoelins.2003@gmail.com' && profile.role === 'platform_admin';
  const isPlatformTeam = ['platform_support', 'platform_engineer'].includes(profile.role || '');
  const isAuthorizedPlatformUser = isPlatformAdmin || isPlatformTeam;
  
  if (!isAuthorizedPlatformUser) {
    return <AccessDenied reason="PLATFORM_ACCESS_DENIED" />;
  }
  
  return <>{children}</>;
};
