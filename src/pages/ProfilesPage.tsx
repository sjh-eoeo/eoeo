import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useProfileStore } from '../store/useProfileStore';
import { useVideoStore } from '../store/useVideoStore';
import { usePaymentStore } from '../store/usePaymentStore';
import { useBrandStore } from '../store/useBrandStore';
import { useAuthStore } from '../store/useAuthStore';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { ProfileForm } from '../components/features/profiles/ProfileForm';
import { useTableState, createTable } from '../hooks/useTableState';
import { useFirestore } from '../hooks/useFirestore';
import { useStorage } from '../hooks/useStorage';
import type { Profile } from '../types';
import { formatCurrency } from '../lib/utils/currency';

export const ProfilesPage: React.FC = () => {
  const { profiles } = useProfileStore();
  const { videos } = useVideoStore();
  const { payments } = usePaymentStore();
  const { selectedBrand } = useBrandStore();
  const { appUser } = useAuthStore();
  const { updateDocument, batchDeleteDocuments } = useFirestore();
  const { uploadFile, getFileURL } = useStorage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const videoCountsByProfile = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach((video) => {
      counts.set(video.tiktokId, (counts.get(video.tiktokId) || 0) + 1);
    });
    return counts;
  }, [videos]);

  const paymentStatsByProfile = useMemo(() => {
    const stats = new Map<string, { count: number; totalAmount: number }>();
    payments.forEach((payment) => {
      const current = stats.get(payment.tiktokId) || { count: 0, totalAmount: 0 };
      current.count += 1;
      current.totalAmount += payment.amount;
      stats.set(payment.tiktokId, current);
    });
    return stats;
  }, [payments]);

  const filteredProfiles = useMemo(() => {
    // Always show all profiles, don't filter by brand
    // This ensures newly added profiles are always visible
    let result = [...profiles];

    // Filter by search term only
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.tiktokId.toLowerCase().includes(term));
    }

    return result;
  }, [profiles, searchTerm]);

  const handleUpdateAmount = async (tiktokId: string, amount: number) => {
    try {
      await updateDocument('profiles', tiktokId, { contractAmount: amount });
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('Failed to update contract amount');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Delete ${selectedIds.size} profile(s)?`)) return;

    try {
      await batchDeleteDocuments('profiles', Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting profiles:', error);
      alert('Failed to delete profiles');
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    profile: Profile
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(profile.tiktokId);
    const timestamp = new Date().toISOString();
    const path = `contracts/${profile.tiktokId}/${timestamp}_${file.name}`;

    try {
      const result = await uploadFile(path, file);
      
      // Get existing files or create new array
      const existingFiles = profile.contractFiles || [];
      
      // Add new file to array
      const newFile = {
        fileName: result.fileName,
        filePath: result.filePath,
        uploadedAt: timestamp,
      };
      
      await updateDocument('profiles', profile.tiktokId, {
        contractFiles: [...existingFiles, newFile],
      });
      
      alert('File uploaded successfully! Go to Docs page to view all files.');
    } catch (error) {
      console.error('Error uploading contract:', error);
      alert('Failed to upload contract file');
    } finally {
      setUploadingId(null);
    }
  };

  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) =>
          appUser?.role === 'admin' ? (
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
            />
          ) : null,
        cell: ({ row }) =>
          appUser?.role === 'admin' ? (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
            />
          ) : null,
        size: 50,
      },
      {
        accessorKey: 'tiktokId',
        header: 'TikTok ID',
        cell: (info) => (
          <span className="font-medium text-white whitespace-nowrap">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: (info) => (
          <span className="whitespace-nowrap">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'contractAmount',
        header: 'Contract Amount',
        cell: ({ row }) => {
          const [amount, setAmount] = useState(
            String(row.original.contractAmount)
          );

          return (
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => {
                  const newAmount = Number(amount);
                  if (
                    !isNaN(newAmount) &&
                    newAmount !== row.original.contractAmount
                  ) {
                    if (
                      confirm(
                        `Change contract amount from ${formatCurrency(
                          row.original.contractAmount
                        )} to ${formatCurrency(newAmount)}?`
                      )
                    ) {
                      handleUpdateAmount(row.original.tiktokId, newAmount);
                    } else {
                      setAmount(String(row.original.contractAmount));
                    }
                  }
                }}
                className="bg-gray-700 border-gray-600 rounded-md pl-6 pr-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-28"
              />
            </div>
          );
        },
      },
      {
        id: 'paymentProgress',
        header: 'Payment Progress',
        cell: ({ row }) => {
          const stats = paymentStatsByProfile.get(row.original.tiktokId) || {
            count: 0,
            totalAmount: 0,
          };
          const progressPercent =
            row.original.contractAmount > 0
              ? (stats.totalAmount / row.original.contractAmount) * 100
              : 0;

          return (
            <div className="flex flex-col min-w-48">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-white">
                  {stats.count} / {row.original.numberOfPayments} Payments
                </span>
                <span className="text-gray-400">
                  {formatCurrency(stats.totalAmount)} /{' '}
                  {formatCurrency(row.original.contractAmount)}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          );
        },
        size: 250,
      },
      {
        id: 'videoCount',
        header: 'Videos',
        cell: ({ row }) => {
          const count = videoCountsByProfile.get(row.original.tiktokId) || 0;
          return (
            <div className="text-center">
              <div className="font-semibold text-white">{count}</div>
              <div className="text-xs text-gray-400">
                / {row.original.totalVideoCount}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalVideoCount',
        header: 'Total Videos',
        cell: ({ row }) => {
          const [value, setValue] = useState(
            String(row.original.totalVideoCount)
          );

          return (
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                const newValue = Number(value);
                if (
                  !isNaN(newValue) &&
                  newValue > 0 &&
                  newValue !== row.original.totalVideoCount
                ) {
                  if (
                    confirm(
                      `Change total videos from ${row.original.totalVideoCount} to ${newValue}?`
                    )
                  ) {
                    updateDocument('profiles', row.original.tiktokId, {
                      totalVideoCount: newValue,
                    });
                  } else {
                    setValue(String(row.original.totalVideoCount));
                  }
                }
              }}
              className="bg-gray-700 border-gray-600 rounded-md px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-20 text-center"
              min="1"
            />
          );
        },
        size: 120,
      },
      {
        accessorKey: 'numberOfPayments',
        header: 'Payments',
        cell: ({ row }) => {
          const [value, setValue] = useState(
            String(row.original.numberOfPayments)
          );

          return (
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                const newValue = Number(value);
                if (
                  !isNaN(newValue) &&
                  newValue > 0 &&
                  newValue !== row.original.numberOfPayments
                ) {
                  if (
                    confirm(
                      `Change number of payments from ${row.original.numberOfPayments} to ${newValue}?`
                    )
                  ) {
                    updateDocument('profiles', row.original.tiktokId, {
                      numberOfPayments: newValue,
                    });
                  } else {
                    setValue(String(row.original.numberOfPayments));
                  }
                }
              }}
              className="bg-gray-700 border-gray-600 rounded-md px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-20 text-center"
              min="1"
            />
          );
        },
        size: 100,
      },
      {
        id: 'contractFiles',
        header: 'Contract Files',
        cell: ({ row }) => {
          const profile = row.original;
          const isUploading = uploadingId === profile.tiktokId;
          const fileCount = profile.contractFiles?.length || 0;

          return (
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
                  {isUploading ? 'Uploading...' : fileCount > 0 ? 'Add More' : 'Upload'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, profile)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={isUploading}
                />
              </label>
            </div>
          );
        },
        size: 180,
      },
    ],
    [appUser, videoCountsByProfile, paymentStatsByProfile, uploadingId]
  );

  const tableState = useTableState();
  const table = createTable({
    data: filteredProfiles,
    columns,
    state: tableState,
    enableRowSelection: appUser?.role === 'admin',
    getRowId: (row) => (row as Profile).tiktokId,
  });

  // Sync selected rows with state
  React.useEffect(() => {
    const selectedRowIds = new Set(
      table.getSelectedRowModel().rows.map((row) => (row.original as Profile).tiktokId)
    );
    setSelectedIds(selectedRowIds);
  }, [table.getSelectedRowModel().rows]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Profile Management
          </h2>
          {appUser?.role === 'admin' && selectedIds.size > 0 && (
            <p className="text-sm text-cyan-400">
              {selectedIds.size} item(s) selected
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search TikTok ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />

          {appUser?.role === 'admin' && selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
              Delete Selected ({selectedIds.size})
            </Button>
          )}

          <Button size="md" onClick={() => setIsModalOpen(true)}>
            + Add Profile
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <DataTable
          table={table}
          emptyMessage="No profiles found. Try adjusting your filters."
        />
      </div>

      {/* Add Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Profile"
        size="md"
      >
        <ProfileForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
