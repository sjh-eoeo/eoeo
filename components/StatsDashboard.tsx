import React from 'react';
import { VideoRecord, Profile } from '../types';
import { ChartIcon } from './icons/ChartIcon';

interface StatsDashboardProps {
  videos: VideoRecord[];
  profiles: Profile[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ videos, profiles }) => {

  const totalViews = videos.length;
  const averageViews = totalViews > 0 ? (videos.reduce((acc, v) => acc + (v.views || 0), 0) / totalViews) : 0;
  const totalLikes = videos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

  const videosByProfile = videos.reduce((acc, video) => {
    if (!acc[video.tiktokId]) {
      acc[video.tiktokId] = [];
    }
    acc[video.tiktokId].push(video);
    return acc;
  }, {} as Record<string, VideoRecord[]>);

  const topPerformingProfiles = Object.keys(videosByProfile)
    .map(tiktokId => ({
      tiktokId,
      videoCount: videosByProfile[tiktokId].length,
      totalViews: videosByProfile[tiktokId].reduce((acc, v) => acc + (v.views || 0), 0),
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <ChartIcon className="h-6 w-6 mr-3 text-cyan-400" />
        Statistics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Total Videos</p>
          <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Avg. Views</p>
          <p className="text-2xl font-bold text-white">{Math.round(averageViews).toLocaleString()}</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Total Likes</p>
          <p className="text-2xl font-bold text-white">{totalLikes.toLocaleString()}</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400">Engagement Rate</p>
          <p className="text-2xl font-bold text-white">{engagementRate.toFixed(2)}%</p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Top 5 Performing Profiles</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
              <tr>
                <th className="px-6 py-3">Profile</th>
                <th className="px-6 py-3 text-right">Video Count</th>
                <th className="px-6 py-3 text-right">Total Views</th>
              </tr>
            </thead>
            <tbody>
              {topPerformingProfiles.map(p => (
                <tr key={p.tiktokId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{p.tiktokId}</td>
                  <td className="px-6 py-4 text-right">{p.videoCount}</td>
                  <td className="px-6 py-4 text-right">{p.totalViews.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topPerformingProfiles.length === 0 && (
            <p className="text-center text-gray-400 py-6">No profile performance data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;