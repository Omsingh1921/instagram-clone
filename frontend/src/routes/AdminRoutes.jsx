import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminEmailDashboard from '../pages/admin/AdminEmailDashboard';
import AdminConfigHubPage from '../pages/admin/AdminConfigHubPage';
import SettingsPage from '../pages/settings/SettingsPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboardPage />} />
      <Route path="reports" element={<AdminReportsPage />} />
      <Route path="moderation" element={<AdminReportsPage />} />
      <Route path="email" element={<AdminEmailDashboard />} />
      <Route path="configs" element={<AdminConfigHubPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

