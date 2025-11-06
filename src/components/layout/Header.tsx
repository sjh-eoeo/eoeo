import React from 'react';
import { useBrandStore } from '../../store/useBrandStore';
import { useAuthStore } from '../../store/useAuthStore';
import { auth } from '../../lib/firebase/config';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

export const Header: React.FC = () => {
  const { brands, selectedBrand, setSelectedBrand } = useBrandStore();
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-white">
              TikTok Dashboard
            </h1>
          </div>

          {/* Brand Selection Dropdown */}
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

          {/* User Info & Sign Out */}
          <div className="flex items-center space-x-3 flex-shrink-0">
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
