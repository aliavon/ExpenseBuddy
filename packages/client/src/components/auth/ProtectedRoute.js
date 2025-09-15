import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { Spinner } from 'baseui/spinner';
import { HeadingMedium } from 'baseui/typography';

import { useAuth } from '../../contexts/AuthContext';

// Loading component
const LoadingSpinner = () => (
  <Block
    display="flex"
    justifyContent="center"
    alignItems="center"
    height="100vh"
    flexDirection="column"
  >
    <Spinner size={48} />
    <HeadingMedium marginTop="scale600">
      Loading...
    </HeadingMedium>
  </Block>
);

// Component for protected routes
const ProtectedRoute = ({
  children,
  requiredRole = null,
  fallback = null,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while determining authentication status
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role if required
  if (requiredRole && user?.roleInFamily !== requiredRole) {
    // Can add role hierarchy check
    const roleHierarchy = ['MEMBER', 'ADMIN', 'OWNER'];
    const userRoleIndex = roleHierarchy.indexOf(user?.roleInFamily);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    // If user role is below required
    if (userRoleIndex < requiredRoleIndex) {
      return fallback || (
        <Block
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          flexDirection="column"
          backgroundColor="negative50"
          padding="scale600"
        >
          <HeadingMedium color="negative">
            Insufficient access rights
          </HeadingMedium>
        </Block>
      );
    }
  }

  // If everything is ok, show content
  return children;
};

export default ProtectedRoute;
