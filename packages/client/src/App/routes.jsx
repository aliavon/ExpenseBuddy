import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Block } from 'baseui/block';

import AddPurchasesComponent from '../components/AddPurchasesComponent';
import ViewPurchasesComponent from '../components/ViewPurchasesComponent';
import FamilyIncome from '../components/FamilyIncome';
import LoginPage from '../pages/auth/LoginPage';
import RequestPasswordResetPage from '../pages/auth/RequestPasswordResetPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const RootRoutes = () => {
  const { isAuthenticated } = useAuth();

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
          path="/auth/request-reset"
          element={<RequestPasswordResetPage />}
        />
        <Route
          path="/auth/reset/:token"
          element={<ResetPasswordPage />}
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
            isAuthenticated ?
              <Navigate
                to="/add"
                replace
              /> :
              <Navigate
                to="/login"
                replace
              />
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
