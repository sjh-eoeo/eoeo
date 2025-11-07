import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBrandStore } from '../../store/useBrandStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectSelector } from '../../store/useProjectSelector';
import { auth } from '../../lib/firebase/config';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brands, selectedBrand, setSelectedBrand } = useBrandStore();
  const { user } = useAuthStore();
  const { currentProject, setCurrentProject } = useProjectSelector();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // 허브 페이지인지 확인
  const isHubPage = location.pathname === '/';
  
  // 현재 어떤 시스템에 있는지 감지
  const current10K = location.pathname.startsWith('/10k');
  const currentSeeding = location.pathname.startsWith('/seeding');

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo - 클릭하면 허브로 이동 */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
            >
              TikTok Dashboard
            </button>
          </div>

          {/* Current System Badge */}
          {!isHubPage && (
            <div className="flex items-center gap-2">
              {current10K && (
                <span className="px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
                  10K System
                </span>
              )}
              {currentSeeding && (
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  Seeding System
                </span>
              )}
            </div>
          )}

          {/* Brand Selection Dropdown (10K only) */}
          {current10K && (
            <div className="flex-shrink-0" style={{ minWidth: '200px' }}>
              <Select
                label=""
                value={selectedBrand || ''}
                onChange={(e) => setSelectedBrand(e.target.value)}
                options={brands.map((brand) => ({
                  value: brand,
                  label: brand.toUpperCase(),
                }))}
              />
            </div>
          )}

          {/* User Info & Sign Out */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {!isHubPage && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate('/')}
                className="hidden md:block"
              >
                Hub
              </Button>
            )}
            <span className="text-sm text-gray-400 truncate max-w-xs hidden md:block">
              {user?.email}
            </span>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
