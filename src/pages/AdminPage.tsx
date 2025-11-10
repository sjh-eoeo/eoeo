import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useVideoStore } from '../store/useVideoStore';
import { useProfileStore } from '../store/useProfileStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { formatCurrency } from '../lib/utils/currency';
import { db } from '../lib/firebase/config';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { useRealtimeCollection } from '../hooks/useRealtimeCollection';
import { useFirestore } from '../hooks/useFirestore';
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Tutorial } from '../components/ui/Tutorial';
import type { AppUser, UserStatus, UserRole } from '../types';

const ADMIN_EMAIL = 'sjh@egongegong.com';

const columnHelper = createColumnHelper<AppUser>();

export const AdminPage: React.FC = () => {
  const { appUser } = useAuthStore();
  const { videos } = useVideoStore();
  const { profiles } = useProfileStore();
  const { payments } = usePaymentStore();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch all users
  const [users, setUsers] = useState<AppUser[]>([]);
  const { updateDocument } = useFirestore();

  useRealtimeCollection<AppUser>('users', setUsers);

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

  // Handle user status update
  const handleStatusChange = async (uid: string, newStatus: UserStatus) => {
    try {
      await updateDocument('users', uid, { status: newStatus });
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status');
    }
  };

  // Handle user role update
  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateDocument('users', uid, { role: newRole });
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  // User management table columns
  const userColumns = [
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <div className="text-sm text-white">{info.getValue() || 'N/A'}</div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const user = info.row.original;
        const status = info.getValue();
        return (
          <select
            value={status}
            onChange={(e) => handleStatusChange(user.uid, e.target.value as UserStatus)}
            className="bg-gray-700 border-gray-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        );
      },
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => {
        const user = info.row.original;
        const role = info.getValue();
        return (
          <select
            value={role}
            onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
            className="bg-gray-700 border-gray-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500"
          >
            <option value="user">User</option>
            <option value="finance">Finance</option>
            <option value="admin">Admin</option>
          </select>
        );
      },
    }),
    columnHelper.accessor('uid', {
      header: 'User ID',
      cell: (info) => (
        <div className="text-xs text-gray-400 font-mono">{info.getValue()}</div>
      ),
    }),
  ];

  const userTable = useReactTable({
    data: users,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!appUser || appUser.role !== 'admin') {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <p className="text-red-400">Access Denied: Admin only</p>
      </div>
    );
  }

  return (
    <>
      <Tutorial page="admin" />
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

      {/* User Management */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          User Management
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Manage user access and permissions. Users with "Approved" status can access the system.
          Finance role can only view Finance page (read-only). Admins can delete data across all pages.
        </p>
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <DataTable
            table={userTable}
            emptyMessage="No users found."
          />
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
    </>
  );
};
