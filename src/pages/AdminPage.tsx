import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useVideoStore } from '../store/useVideoStore';
import { useProfileStore } from '../store/useProfileStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils/currency';
import { db } from '../lib/firebase/config';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

export const AdminPage: React.FC = () => {
  const { appUser } = useAuthStore();
  const { videos } = useVideoStore();
  const { profiles } = useProfileStore();
  const { payments } = usePaymentStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const systemStats = useMemo(() => {
    const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
    const totalLikes = videos.reduce((acc, v) => acc + (v.likes || 0), 0);
    const totalContractAmount = profiles.reduce(
      (acc, p) => acc + p.contractAmount,
      0
    );
    const totalPaidAmount = payments.reduce((acc, p) => acc + p.amount, 0);

    // Videos by brand
    const videosByBrand = videos.reduce((acc, video) => {
      acc[video.brand] = (acc[video.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Profiles with file uploads
    const profilesWithContracts = profiles.filter(
      (p) => p.contractFilePath
    ).length;
    const videosWithFiles = videos.filter((v) => v.videoFilePath).length;
    const paymentsWithInvoices = payments.filter((p) => p.invoiceFilePath).length;

    return {
      totalVideos: videos.length,
      totalProfiles: profiles.length,
      totalPayments: payments.length,
      totalViews,
      totalLikes,
      totalContractAmount,
      totalPaidAmount,
      videosByBrand,
      profilesWithContracts,
      videosWithFiles,
      paymentsWithInvoices,
    };
  }, [videos, profiles, payments]);

  const handleDeleteAllData = async () => {
    const confirmText = 'DELETE ALL DATA';
    const userInput = prompt(
      `⚠️ WARNING: This will permanently delete ALL data from Firebase!\n\nThis includes:\n- All videos (${systemStats.totalVideos})\n- All profiles (${systemStats.totalProfiles})\n- All payments (${systemStats.totalPayments})\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        alert('Deletion cancelled. Text did not match.');
      }
      return;
    }

    setIsDeleting(true);

    try {
      const collections = ['videos', 'profiles', 'payments'];
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        console.log(`Deleting ${snapshot.size} documents from ${collectionName}...`);
        
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        console.log(`✓ Deleted all documents from ${collectionName}`);
      }

      alert('✓ All data has been deleted successfully!');
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Failed to delete data. Check console for details.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!appUser || appUser.role !== 'admin') {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <p className="text-red-400">Access Denied: Admin only</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Admin Dashboard
            </h2>
            <p className="text-sm text-gray-400">
              System overview and administrative controls
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAllData}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete All Data'}
            </Button>
            <Badge variant="danger">ADMIN</Badge>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Videos</h3>
          <p className="text-3xl font-bold text-white">
            {systemStats.totalVideos.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {systemStats.videosWithFiles} with files
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Profiles</h3>
          <p className="text-3xl font-bold text-white">
            {systemStats.totalProfiles}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {systemStats.profilesWithContracts} with contracts
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Payments</h3>
          <p className="text-3xl font-bold text-white">
            {systemStats.totalPayments}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {systemStats.paymentsWithInvoices} with invoices
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-white">
            {systemStats.totalViews.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {systemStats.totalLikes.toLocaleString()} likes
          </p>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Financial Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Contract Value</span>
              <span className="text-lg font-semibold text-white">
                {formatCurrency(systemStats.totalContractAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Paid</span>
              <span className="text-lg font-semibold text-green-400">
                {formatCurrency(systemStats.totalPaidAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Remaining</span>
              <span className="text-lg font-semibold text-yellow-400">
                {formatCurrency(
                  systemStats.totalContractAmount - systemStats.totalPaidAmount
                )}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Payment Progress</span>
                <span className="text-lg font-semibold text-cyan-400">
                  {systemStats.totalContractAmount > 0
                    ? (
                        (systemStats.totalPaidAmount /
                          systemStats.totalContractAmount) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Videos by Brand */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Videos by Brand
          </h3>
          {Object.keys(systemStats.videosByBrand).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(systemStats.videosByBrand)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([brand, count]) => {
                  const percentage =
                    ((count as number) / systemStats.totalVideos) * 100;
                  return (
                    <div
                      key={brand}
                      className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg"
                    >
                      <span className="text-white font-medium uppercase">
                        {brand}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{count} videos</span>
                        <div className="w-24 bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No video data</p>
          )}
        </div>
      </div>

      {/* Current User Info */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Current Session
        </h3>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{appUser.email}</p>
              <p className="text-sm text-gray-400">Logged in as Administrator</p>
            </div>
            <Badge variant="info">ADMIN</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
