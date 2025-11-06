import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getVisibleNavItems } from '../../config/navConfig';

export const MainNav: React.FC = () => {
  const { appUser } = useAuthStore();
  
  if (!appUser) return null;

  const navItems = getVisibleNavItems(appUser.role);

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
