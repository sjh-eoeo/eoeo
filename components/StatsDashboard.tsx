import React, { useState, useMemo } from 'react';
import { VideoRecord, Profile, Brand } from '../types';
import { ChartIcon } from './icons/ChartIcon';
import { SearchIcon } from './icons/SearchIcon';

interface StatsDashboardProps {
  videos: VideoRecord[];
  profiles: Profile[];
  brands: Brand[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ videos, profiles, brands }) => {
  const [brandFilter, setBrandFilter] = useState<Brand | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const profileStats = useMemo(() => {
    const filteredVideos = brandFilter === 'all'
      ? videos
      : videos.filter(v => v.brand === brandFilter);

    const videoCounts = new Map<string, number>();
    filteredVideos.forEach(video => {
      videoCounts.set(video.tiktokId, (videoCounts.get(video.tiktokId) || 0) + 1);
    });

    let stats = profiles.map(profile => ({
        ...profile,
        videoCount: videoCounts.get(profile.tiktokId) || 0,
    }));
    
    if (searchTerm.trim() !== '') {
        stats = stats.filter(s => s.tiktokId.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    const finalStats = brandFilter !== 'all' 
        ? stats.filter(s => s.videoCount > 0)
        : stats;

    return finalStats.sort((a, b) => b.videoCount - a.videoCount);
  }, [videos, profiles, brandFilter, searchTerm]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center">
          <ChartIcon className="h-6 w-6 mr-3 text-cyan-400" />
          Account Stats
        </h2>
        <div className="flex items-center space-x-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md pl-9 pr-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                />
            </div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value as Brand | 'all')}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
              aria-label="Filter stats by brand"
            >
              <option value="all">All Brands</option>
              {brands.map(b => (
                  <option key={b} value={b}>{b.toUpperCase()}</option>
              ))}
            </select>
        </div>
      </div>
      {profileStats.length > 0 ? (
         <div className="max-h-96 overflow-y-auto pr-2">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                    <tr>
                        <th scope="col" className="px-6 py-3">Profile</th>
                        <th scope="col" className="px-6 py-3 text-center">Uploaded Videos</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {profileStats.map((stat) => (
                        <tr key={stat.tiktokId} className="hover:bg-gray-700/50">
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                {stat.tiktokProfileLink ? (
                                    <a href={stat.tiktokProfileLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                        {stat.tiktokId}
                                    </a>
                                ) : (
                                    <span>{stat.tiktokId}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-lg">{stat.videoCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      ) : (
        <p className="text-gray-400 text-center py-4">No data available for the selected filter.</p>
      )}
    </div>
  );
};

export default StatsDashboard;