import React, { useState } from 'react';
import { Brand } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import Modal from './Modal';

interface SettingsPageProps {
  brands: Brand[];
  onAddBrand: (brandName: string) => void;
  onRemoveBrand: (brandName: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ brands, onAddBrand, onRemoveBrand }) => {
  const [newBrandName, setNewBrandName] = useState('');
  const [brandToRemove, setBrandToRemove] = useState<Brand | null>(null);

  const handleAddBrand = () => {
    if (newBrandName.trim()) {
      onAddBrand(newBrandName);
      setNewBrandName('');
    }
  };

  const handleConfirmRemove = () => {
    if (brandToRemove) {
      onRemoveBrand(brandToRemove);
      setBrandToRemove(null);
    }
  };

  return (
    <>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Brand</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Enter brand name"
              className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 transition"
            />
            <button
              onClick={handleAddBrand}
              className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 transition"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Manage Brands</h2>
          {brands.length > 0 ? (
            <ul className="space-y-2">
              {brands.map((brand) => (
                <li
                  key={brand}
                  className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md"
                >
                  <span className="font-medium text-white">{brand.toUpperCase()}</span>
                  <button
                    onClick={() => setBrandToRemove(brand)}
                    className="text-sm text-red-400 hover:text-red-300 font-semibold"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No brands have been added yet.</p>
          )}
        </div>
      </div>

      {brandToRemove && (
        <Modal
          isOpen={!!brandToRemove}
          onClose={() => setBrandToRemove(null)}
          title="Confirm Removal"
          size="sm"
        >
          <div className="space-y-6">
            <p className="text-gray-300">
              Are you sure you want to remove the brand "{brandToRemove.toUpperCase()}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setBrandToRemove(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                Cancel
              </button>
              <button onClick={handleConfirmRemove} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">
                Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SettingsPage;
