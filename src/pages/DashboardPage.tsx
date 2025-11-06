import React, { useMemo } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { useProfileStore } from '../store/useProfileStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { useBrandStore } from '../store/useBrandStore';
import { formatCurrency } from '../lib/utils/currency';
import { Badge } from '../components/ui/Badge';

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
    const relevantProfileIds = new Set(filteredVideos.map((v) => v.tiktokId));
    const allProfileIdsWithVideos = new Set(videos.map((v) => v.tiktokId));
    return profiles.filter(
      (p) =>
        relevantProfileIds.has(p.tiktokId) ||
        !allProfileIdsWithVideos.has(p.tiktokId)
    );
  }, [profiles, filteredVideos, videos, selectedBrand]);

  const filteredPayments = useMemo(() => {
    if (!selectedBrand) return payments;
    const relevantProfileIds = new Set(filteredVideos.map((v) => v.tiktokId));
    return payments.filter((p) => relevantProfileIds.has(p.tiktokId));
  }, [payments, filteredVideos, selectedBrand]);

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

  // Top performing profiles
  const topProfiles = useMemo(() => {
    const profileStats = filteredProfiles.map((profile) => {
      const profileVideos = filteredVideos.filter(
        (v) => v.tiktokId === profile.tiktokId
      );
      const totalViews = profileVideos.reduce(
        (acc, v) => acc + (v.views || 0),
        0
      );
      const totalLikes = profileVideos.reduce(
        (acc, v) => acc + (v.likes || 0),
        0
      );
      return {
        profile,
        videoCount: profileVideos.length,
        totalViews,
        totalLikes,
        avgViews:
          profileVideos.length > 0 ? totalViews / profileVideos.length : 0,
      };
    });

    return profileStats.sort((a, b) => b.totalViews - a.totalViews).slice(0, 5);
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        {/* Top Performing Profiles */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Top Performing Profiles
          </h3>
          {topProfiles.length > 0 ? (
            <div className="space-y-3">
              {topProfiles.map((item, index) => (
                <div
                  key={item.profile.tiktokId}
                  className="bg-gray-700/50 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm font-semibold">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-white">
                        {item.profile.tiktokId}
                      </span>
                    </div>
                    <Badge variant="info">{item.videoCount} videos</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Total Views</p>
                      <p className="font-semibold text-white">
                        {item.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Avg Views</p>
                      <p className="font-semibold text-white">
                        {Math.round(item.avgViews).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Likes</p>
                      <p className="font-semibold text-white">
                        {item.totalLikes.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No profile data available
            </p>
          )}
        </div>

        {/* Recent Videos */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Recent Videos
          </h3>
          {recentVideos.length > 0 ? (
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-700/50 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">
                      {video.tiktokId}
                    </span>
                    <span className="text-sm text-gray-400">
                      {video.uploadDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-gray-400">Views: </span>
                        <span className="font-semibold text-white">
                          {(video.views || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Likes: </span>
                        <span className="font-semibold text-white">
                          {(video.likes || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success">
                      {video.videoId || 'No ID'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No recent videos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
