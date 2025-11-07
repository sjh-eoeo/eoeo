import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectSelector } from '../../store/useProjectSelector';
import { getVisibleNavItems } from '../../config/navConfig';

export const MainNav: React.FC = () => {
  const { appUser } = useAuthStore();
  const { currentProject } = useProjectSelector();
  const location = useLocation();
  
  if (!appUser) return null;

  // 허브 페이지에서는 네비게이션 숨김
  if (location.pathname === '/') return null;

  // 현재 경로에 따라 프로젝트 자동 감지
  const detectedProject = location.pathname.startsWith('/10k') ? '10k' : 'negotiation';
  const navItems = getVisibleNavItems(appUser.role, detectedProject);

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
