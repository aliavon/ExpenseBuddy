import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';

import AddPurchasesComponent from '../components/AddPurchasesComponent';
import ViewPurchasesComponent from '../components/ViewPurchasesComponent';
import FamilyIncome from '../components/FamilyIncome';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import RequestPasswordResetPage from '../pages/auth/RequestPasswordResetPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import FamilySetupPage from '../pages/family/FamilySetupPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const RootRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Programmatic redirect for users without familyId
  useEffect(() => {
    if (isAuthenticated && user && (!user.familyId || user.familyId === null)) {
      // Only redirect if we're not already on auth or family-setup pages
      const currentPath = location.pathname;
      if (!currentPath.startsWith('/auth') && currentPath !== '/family-setup') {
        navigate('/family-setup', { replace: true });
      }
    }
  }, [
    isAuthenticated,
    user,
    navigate,
    location,
  ]);

  return (
    <Block
      display="flex"
      padding={isAuthenticated ? 'scale700' : '0'}
      width="100%"
    >
      <Routes>
        {/* Public routes - Auth */}
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/auth/login"
          element={<LoginPage />}
        />
        <Route
          path="/auth/register"
          element={<RegisterPage />}
        />
        <Route
          path="/auth/request-reset"
          element={<RequestPasswordResetPage />}
        />
        <Route
          path="/auth/reset/:token"
          element={<ResetPasswordPage />}
        />
        <Route
          path="/auth/verify-email"
          element={<VerifyEmailPage />}
        />
        {/* Family Setup - protected but for users without family */}
        <Route
          path="/family-setup"
          element={(
            <ProtectedRoute>
              <FamilySetupPage />
            </ProtectedRoute>
          )}
        />

        {/* Protected routes */}
        <Route
          path="/add"
          element={(
            <ProtectedRoute>
              <AddPurchasesComponent />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/view"
          element={(
            <ProtectedRoute>
              <ViewPurchasesComponent />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/income"
          element={(
            <ProtectedRoute>
              <FamilyIncome />
            </ProtectedRoute>
          )}
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to="/add"
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route
          path="*"
          element={<Navigate
            to="/"
            replace
          />}
        />
      </Routes>
    </Block>
  );
};

export default RootRoutes;
