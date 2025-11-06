import React, { useMemo } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { useProfileStore } from '../store/useProfileStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { useBrandStore } from '../store/useBrandStore';
import { formatCurrency } from '../lib/utils/currency';
import { Badge } from '../components/ui/Badge';
import { Tutorial } from '../components/ui/Tutorial';

export const DashboardPage: React.FC = () => {
  const { videos } = useVideoStore();
  const { profiles } = useProfileStore();
  const { payments } = usePaymentStore();
  const { selectedBrand } = useBrandStore();

  const filteredVideos = useMemo(() => {
    if (!selectedBrand) return videos;
    return videos.filter((video) => video.brand === selectedBrand);
  }, [videos, selectedBrand]);

  const filteredProfiles = useMemo(() => {
    if (!selectedBrand) return profiles;
    return profiles.filter((p) => p.brand === selectedBrand);
  }, [profiles, selectedBrand]);

  const filteredPayments = useMemo(() => {
    if (!selectedBrand) return payments;
    return payments.filter((p) => p.brand === selectedBrand);
  }, [payments, selectedBrand]);

  const stats = useMemo(() => {
    const totalViews = filteredVideos.reduce((acc, v) => acc + (v.views || 0), 0);
    const averageViews =
      filteredVideos.length > 0 ? totalViews / filteredVideos.length : 0;
    const totalLikes = filteredVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
    const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

    const totalContractAmount = filteredProfiles.reduce(
      (acc, p) => acc + p.contractAmount,
      0
    );
    const totalPaidAmount = filteredPayments.reduce(
      (acc, p) => acc + p.amount,
      0
    );
    const remainingAmount = totalContractAmount - totalPaidAmount;
    const paymentProgress =
      totalContractAmount > 0 ? (totalPaidAmount / totalContractAmount) * 100 : 0;

    return {
      totalProfiles: filteredProfiles.length,
      totalVideos: filteredVideos.length,
      averageViews: Math.round(averageViews),
      totalViews,
      totalLikes,
      engagementRate: engagementRate.toFixed(2),
      totalContractAmount,
      totalPaidAmount,
      remainingAmount,
      paymentProgress: paymentProgress.toFixed(1),
    };
  }, [filteredVideos, filteredProfiles, filteredPayments]);

  // Top performing profiles by video count
  const topProfiles = useMemo(() => {
    const profileStats = filteredProfiles.map((profile) => {
      const profileVideos = filteredVideos.filter(
        (v) => v.tiktokId === profile.tiktokId
      );
      return {
        profile,
        videoCount: profileVideos.length,
        tiktokProfileUrl: profileVideos[0]?.tiktokProfileUrl || `https://www.tiktok.com/@${profile.tiktokId}`,
      };
    });

    return profileStats.sort((a, b) => b.videoCount - a.videoCount).slice(0, 5);
  }, [filteredProfiles, filteredVideos]);

  // Recent videos
  const recentVideos = useMemo(() => {
    return [...filteredVideos]
      .sort(
        (a, b) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      )
      .slice(0, 5);
  }, [filteredVideos]);

  return (
    <>
      <Tutorial page="dashboard" />
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="summary-cards">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Profiles</h3>
          <p className="text-3xl font-bold text-white">
            {stats.totalProfiles}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Videos</h3>
          <p className="text-3xl font-bold text-white">
            {stats.totalVideos.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-white">
            {stats.totalViews.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Engagement Rate</h3>
          <p className="text-3xl font-bold text-white">{stats.engagementRate}%</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-tour="payment-summary">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Contract</h3>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalContractAmount)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Paid</h3>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.totalPaidAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.paymentProgress}% completed
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Remaining</h3>
          <p className="text-2xl font-bold text-yellow-400">
            {formatCurrency(stats.remainingAmount)}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Profiles by Video Count */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6" data-tour="top-performers">
          <h3 className="text-xl font-semibold text-white mb-4">
            Top Performing Profiles
          </h3>
          {topProfiles.length > 0 ? (
            <div className="space-y-3">
              {topProfiles.map((item, index) => (
                <a
                  key={item.profile.tiktokId}
                  href={item.tiktokProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-700/50 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 text-lg font-bold w-8">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-cyan-400 hover:text-cyan-300">
                          @{item.profile.tiktokId}
                        </p>
                        <p className="text-sm text-gray-400">
                          {item.videoCount} video{item.videoCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">{item.profile.brand}</Badge>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No profile data available
            </p>
          )}
        </div>

        {/* Recent Videos */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6" data-tour="recent-videos">
          <h3 className="text-xl font-semibold text-white mb-4">
            Recent Videos
          </h3>
          {recentVideos.length > 0 ? (
            <div className="space-y-3">
              {recentVideos.map((video) => {
                const profileUrl = video.tiktokProfileUrl || `https://www.tiktok.com/@${video.tiktokId}`;
                const videoUrl = video.videoUrl || `https://www.tiktok.com/@${video.tiktokId}/video/${video.videoId}`;
                
                return (
                  <div
                    key={video.id}
                    className="bg-gray-700/50 p-4 rounded-lg hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                      >
                        {video.tiktokId}
                      </a>
                      <span className="text-sm text-gray-400">
                        {video.uploadDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                      >
                        Video #{video.videoId}
                      </a>
                      <Badge variant="success">
                        {video.brand}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No recent videos
            </p>
          )}
        </div>
      </div>
      </div>
    </>
  );
};
