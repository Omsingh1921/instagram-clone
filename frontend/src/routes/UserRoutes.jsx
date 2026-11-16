import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ExplorePage from '../pages/ExplorePage';
import ReelsPage from '../pages/ReelsPage';
import AudioTrackPage from '../pages/AudioTrackPage';
import MessagesPage from '../pages/MessagesPage';
import NotificationsPage from '../pages/NotificationsPage';
import SearchPage from '../pages/search/SearchPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import YourActivityPage from '../pages/activity/YourActivityPage';
import HealthStatusPage from '../pages/HealthStatusPage';

export default function UserRoutes() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="explore" element={<ExplorePage />} />
      <Route path="reels" element={<ReelsPage />} />
      <Route path="reels/:reelId" element={<ReelsPage />} />
      <Route path="audio" element={<AudioTrackPage />} />
      <Route path="messages" element={<MessagesPage />} />
      <Route path="messages/:conversationId" element={<MessagesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="profile/me" element={<ProfilePage />} />
      <Route path="profile/:userId" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="your-activity" element={<YourActivityPage />} />
      <Route path="health" element={<HealthStatusPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

