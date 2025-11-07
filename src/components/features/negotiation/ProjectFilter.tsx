import React, { useMemo } from 'react';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import type { ProjectFilter as FilterType } from '../../../types/negotiation';

interface ProjectFilterProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  availableBrands?: string[];
  availableProjects?: string[];
  availableProducts?: string[];
  availableRegions?: string[];
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  filters,
  onFilterChange,
  availableBrands = ['egongegong', 'eoeo', '10k', 'other'],
  availableProjects = [],
  availableProducts = [],
  availableRegions = ['US', 'EU', 'Asia', 'Korea'],
}) => {
  const handleBrandChange = (brand: string) => {
    const currentBrands = filters.brand || [];
    const newBrands = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];
    onFilterChange({ ...filters, brand: newBrands.length > 0 ? newBrands : undefined });
  };

  const handleProjectChange = (project: string) => {
    const currentProjects = filters.projectName || [];
    const newProjects = currentProjects.includes(project)
      ? currentProjects.filter((p) => p !== project)
      : [...currentProjects, project];
    onFilterChange({ ...filters, projectName: newProjects.length > 0 ? newProjects : undefined });
  };

  const handleProductChange = (product: string) => {
    const currentProducts = filters.productLine || [];
    const newProducts = currentProducts.includes(product)
      ? currentProducts.filter((p) => p !== product)
      : [...currentProducts, product];
    onFilterChange({ ...filters, productLine: newProducts.length > 0 ? newProducts : undefined });
  };

  const handleRegionChange = (region: string) => {
    const currentRegions = filters.region || [];
    const newRegions = currentRegions.includes(region)
      ? currentRegions.filter((r) => r !== region)
      : [...currentRegions, region];
    onFilterChange({ ...filters, region: newRegions.length > 0 ? newRegions : undefined });
  };

  const handleSearchChange = (query: string) => {
    onFilterChange({ ...filters, searchQuery: query || undefined });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.brand && filters.brand.length > 0) ||
      (filters.projectName && filters.projectName.length > 0) ||
      (filters.productLine && filters.productLine.length > 0) ||
      (filters.region && filters.region.length > 0) ||
      (filters.status && filters.status.length > 0) ||
      (filters.searchQuery && filters.searchQuery.length > 0)
    );
  }, [filters]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🔍 Filters
          {hasActiveFilters && (
            <span className="text-xs bg-cyan-600 text-white px-2 py-1 rounded">Active</span>
          )}
        </h3>
        {hasActiveFilters && (
          <Button size="sm" variant="secondary" onClick={handleReset}>
            Reset All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
          <div className="space-y-2">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brand?.includes(brand) || false}
                  onChange={() => handleBrandChange(brand)}
                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-300 uppercase">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Project Filter */}
        {availableProjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableProjects.map((project) => (
                <label key={project} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.projectName?.includes(project) || false}
                    onChange={() => handleProjectChange(project)}
                    className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">{project}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Product Filter */}
        {availableProducts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableProducts.map((product) => (
                <label key={product} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.productLine?.includes(product) || false}
                    onChange={() => handleProductChange(product)}
                    className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">{product}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
          <div className="space-y-2">
            {availableRegions.map((region) => (
              <label key={region} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.region?.includes(region) || false}
                  onChange={() => handleRegionChange(region)}
                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-300">{region}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by creator name, project, or keywords..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-400">Active filters:</span>
          {filters.brand?.map((brand) => (
            <span
              key={brand}
              className="text-xs bg-cyan-600 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              {brand.toUpperCase()}
              <button
                onClick={() => handleBrandChange(brand)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
          {filters.projectName?.map((project) => (
            <span
              key={project}
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              {project}
              <button
                onClick={() => handleProjectChange(project)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
          {filters.productLine?.map((product) => (
            <span
              key={product}
              className="text-xs bg-pink-600 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              {product}
              <button
                onClick={() => handleProductChange(product)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
          {filters.region?.map((region) => (
            <span
              key={region}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              {region}
              <button
                onClick={() => handleRegionChange(region)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
