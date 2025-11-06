import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBrandStore } from '../store/useBrandStore';
import { useFirestore } from '../hooks/useFirestore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const ADMIN_EMAIL = 'sjh@egongegong.com';

export const SettingsPage: React.FC = () => {
  const { appUser } = useAuthStore();
  const { brands, selectedBrand, setSelectedBrand } = useBrandStore();
  const { updateDocument } = useFirestore();

  const [newBrandName, setNewBrandName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Check if user is admin
  if (!appUser || appUser.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 p-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-red-400 text-6xl">🚫</div>
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Admin access is restricted to authorized accounts only.
          </p>
        </div>
      </div>
    );
  }

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();

    const brandName = newBrandName.trim().toLowerCase();

    if (!brandName) {
      setError('Brand name is required.');
      return;
    }

    if (brands.includes(brandName)) {
      setError('This brand already exists.');
      return;
    }

    setError('');
    setIsAdding(true);

    try {
      await updateDocument('config', 'brandsDoc', {
        names: [...brands, brandName],
      });
      setNewBrandName('');
    } catch (error) {
      console.error('Error adding brand:', error);
      setError('Failed to add brand. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveBrand = async (brandToRemove: string) => {
    if (brands.length <= 1) {
      alert('Cannot remove the last brand.');
      return;
    }

    if (!confirm(`Remove brand "${brandToRemove}"?`)) return;

    try {
      const updatedBrands = brands.filter((b) => b !== brandToRemove);
      await updateDocument('config', 'brandsDoc', {
        names: updatedBrands,
      });

      // If removed brand was selected, select another one
      if (selectedBrand === brandToRemove && updatedBrands.length > 0) {
        setSelectedBrand(updatedBrands[0]);
      }
    } catch (error) {
      console.error('Error removing brand:', error);
      alert('Failed to remove brand.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Brand Management Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Brand Management
        </h2>

        {/* Add Brand Form */}
        <form onSubmit={handleAddBrand} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Enter new brand name..."
                error={error}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isAdding}
              disabled={isAdding}
            >
              Add Brand
            </Button>
          </div>
        </form>

        {/* Brand List */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Existing Brands ({brands.length})
          </h3>
          
          {brands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div
                  key={brand}
                  className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-white uppercase">
                      {brand}
                    </span>
                    {selectedBrand === brand && (
                      <Badge variant="info">Selected</Badge>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveBrand(brand)}
                    disabled={brands.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No brands available. Add one above.
            </p>
          )}
        </div>
      </div>

      {/* Tutorial Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          💡 Tutorial & Help
        </h2>
        <p className="text-gray-400 mb-6">
          각 페이지의 튜토리얼을 다시 보거나 초기화할 수 있습니다.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">자동 튜토리얼</p>
              <p className="text-sm text-gray-400">
                페이지를 처음 방문할 때 자동으로 튜토리얼이 시작됩니다
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">수동 튜토리얼</p>
              <p className="text-sm text-gray-400">
                각 페이지 우측 하단의 "💡 튜토리얼" 버튼으로 언제든 다시 볼 수 있습니다
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">튜토리얼 초기화</p>
              <p className="text-sm text-gray-400">
                모든 페이지의 튜토리얼 기록을 삭제합니다
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const pages = ['dashboard', 'videos', 'profiles', 'payments', 'finance', 'admin'];
                pages.forEach((page) => {
                  localStorage.removeItem(`tutorial-seen-${page}`);
                });
                alert('✅ 모든 튜토리얼이 초기화되었습니다!');
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </div>

      {/* General Settings Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
          General Settings
        </h2>
        <p className="text-gray-400">
          Additional settings will be added here in the future.
        </p>
      </div>
    </div>
  );
};
