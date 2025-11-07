import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HubPage } from './pages/HubPage';

// 10K System Pages
import { DashboardPage } from './pages/DashboardPage';
import { VideosPage } from './pages/VideosPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { FinancePage } from './pages/FinancePage';
import { DocsPage } from './pages/DocsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

// Seeding System Pages
import { SeedingDashboardPage } from './pages/seeding/DashboardPage';
import { SeedingCreatorsPage } from './pages/seeding/CreatorsPage';
import { SeedingProjectsPage } from './pages/seeding/ProjectsPage';
import { SeedingReachOutPage } from './pages/seeding/ReachOutPage';
import { SeedingNegotiationPage } from './pages/seeding/NegotiationPage';
import { SeedingProductionPage } from './pages/seeding/ProductionPage';
import { SeedingPaymentPage } from './pages/seeding/PaymentPage';
import { SeedingAdminPage } from './pages/seeding/AdminPage';

import { useFirebaseSync } from './hooks/useFirebaseSync';
import { startAutoBackup } from './lib/utils/autoBackup';
import { ROUTES } from './lib/constants/routes';

const App: React.FC = () => {
  // Initialize Firebase realtime subscriptions
  useFirebaseSync();
  
  // Initialize auto-backup system
  useEffect(() => {
    const stopBackup = startAutoBackup();
    return () => stopBackup();
  }, []);

  return (
    <AppLayout>
      <Routes>
        {/* Hub Page - 프로젝트 선택 */}
        <Route path="/" element={<HubPage />} />
        
        {/* ================================ */}
        {/* 10K System (기존 TikTok 관리)    */}
        {/* ================================ */}
        <Route path="/10k/dashboard" element={<DashboardPage />} />
        <Route path="/10k/videos" element={<VideosPage />} />
        <Route path="/10k/profiles" element={<ProfilesPage />} />
        <Route path="/10k/payments" element={<PaymentsPage />} />
        <Route path="/10k/finance" element={<FinancePage />} />
        <Route path="/10k/docs" element={<DocsPage />} />
        <Route path="/10k/settings" element={<SettingsPage />} />
        <Route path="/10k/admin" element={<AdminPage />} />
        
        {/* ================================ */}
        {/* Seeding System (새로운 시스템)    */}
        {/* ================================ */}
        <Route path="/seeding/dashboard" element={<SeedingDashboardPage />} />
        <Route path="/seeding/creators" element={<SeedingCreatorsPage />} />
        
        {/* TODO: 나머지 Seeding 페이지들 */}
        <Route path="/seeding/projects" element={<SeedingProjectsPage />} />
        <Route path="/seeding/reach-out" element={<SeedingReachOutPage />} />
        <Route path="/seeding/negotiation" element={<SeedingNegotiationPage />} />
        <Route path="/seeding/production" element={<SeedingProductionPage />} />
        <Route path="/seeding/payment" element={<SeedingPaymentPage />} />
        <Route path="/seeding/admin" element={<SeedingAdminPage />} />
        
        {/* 임시: 미구현 Seeding 페이지 리다이렉트 */}
        <Route path="/seeding/*" element={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">🚧 Under Construction</h1>
              <p className="text-gray-400 mb-6">이 페이지는 곧 출시됩니다!</p>
              <button 
                onClick={() => window.location.href = '/seeding/dashboard'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        } />
        
        {/* Legacy 라우트 리다이렉트 (기존 북마크 호환성) */}
        <Route path={ROUTES.DASHBOARD} element={<Navigate to="/10k/dashboard" replace />} />
        <Route path={ROUTES.VIDEOS} element={<Navigate to="/10k/videos" replace />} />
        <Route path={ROUTES.PROFILES} element={<Navigate to="/10k/profiles" replace />} />
        <Route path={ROUTES.PAYMENTS} element={<Navigate to="/10k/payments" replace />} />
        <Route path={ROUTES.FINANCE} element={<Navigate to="/10k/finance" replace />} />
        <Route path={ROUTES.DOCS} element={<Navigate to="/10k/docs" replace />} />
        <Route path={ROUTES.SETTINGS} element={<Navigate to="/10k/settings" replace />} />
        <Route path={ROUTES.ADMIN} element={<Navigate to="/10k/admin" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
