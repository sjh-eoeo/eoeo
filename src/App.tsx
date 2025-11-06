import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { VideosPage } from './pages/VideosPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { FinancePage } from './pages/FinancePage';
import { DocsPage } from './pages/DocsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { ROUTES } from './lib/constants/routes';

const App: React.FC = () => {
  // Initialize Firebase realtime subscriptions
  useFirebaseSync();

  return (
    <AppLayout>
      <Routes>
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.VIDEOS} element={<VideosPage />} />
        <Route path={ROUTES.PROFILES} element={<ProfilesPage />} />
        <Route path={ROUTES.PAYMENTS} element={<PaymentsPage />} />
        <Route path={ROUTES.FINANCE} element={<FinancePage />} />
        <Route path={ROUTES.DOCS} element={<DocsPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.ADMIN} element={<AdminPage />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
