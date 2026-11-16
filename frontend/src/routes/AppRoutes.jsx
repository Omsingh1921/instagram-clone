import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicOnlyRoute from '../components/common/PublicOnlyRoute';
import LoginPage from '../pages/auth/LoginPage';
import { SkeletonAuthCard, SkeletonAppShell } from '../components/ui/Skeleton';

// Separate route groups: LoginPage loads immediately; AppLayout, UserRoutes & AdminRoutes load on demand
const AppLayout = lazy(() => import('../layouts/AppLayout'));
const UserRoutes = lazy(() => import('./UserRoutes'));
const AdminRoutes = lazy(() => import('./AdminRoutes'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

const RouteLoader = () => <SkeletonAuthCard />;

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Only Auth Routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<SignupPage />} />
          <Route path="/verify-email" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Application Area */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <Suspense fallback={<SkeletonAppShell />}>
                <AppLayout />
              </Suspense>
            }
          >
            <Route path="admin/*" element={<AdminRoutes />} />
            <Route path="/*" element={<UserRoutes />} />
          </Route>
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
