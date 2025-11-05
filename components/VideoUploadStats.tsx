import React, { useMemo } from 'react';
import { VideoRecord } from '../types';

interface VideoUploadStatsProps {
  videos: VideoRecord[];
}

const VideoUploadStats: React.FC<VideoUploadStatsProps> = ({ videos }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = today - 6 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = today - 29 * 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let last7DaysCount = 0;
    let last30DaysCount = 0;

    for (const video of videos) {
      try {
        // Ensure date is valid before getTime()
        const uploadDateTime = new Date(video.uploadDate).getTime();
        if (isNaN(uploadDateTime)) continue;

        if (uploadDateTime >= today) {
          todayCount++;
        }
        if (uploadDateTime >= sevenDaysAgo) {
          last7DaysCount++;
        }
        if (uploadDateTime >= thirtyDaysAgo) {
          last30DaysCount++;
        }
      } catch (e) {
        console.error("Invalid date format for video:", video);
      }
    }
    return { todayCount, last7DaysCount, last30DaysCount };
  }, [videos]);
  
  const allStats = [stats.todayCount, stats.last7DaysCount, stats.last30DaysCount];
  const maxStat = Math.max(...allStats, 1);

  const StatBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center space-x-2 text-xs">
      <span className="font-medium text-gray-400 w-12">{label}</span>
      <div className="flex-grow bg-gray-700 rounded-full h-2">
        <div 
          className="bg-cyan-400 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(value / maxStat) * 100}%` }}
        ></div>
      </div>
      <span className="font-bold text-white w-8 text-right">{value}</span>
    </div>
  );

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">Recent Uploads</p>
          <p className="text-3xl font-bold text-white">{stats.todayCount} <span className="text-base font-medium text-gray-400">Today</span></p>
        </div>
      </div>
      <div className="space-y-2.5 mt-3">
        <StatBar label="Today" value={stats.todayCount} />
        <StatBar label="7 Days" value={stats.last7DaysCount} />
        <StatBar label="30 Days" value={stats.last30DaysCount} />
      </div>
    </div>
  );
};

export default VideoUploadStats;