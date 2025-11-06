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
import { Tutorial } from '../components/ui/Tutorial';
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
  const [hideSampleData, setHideSampleData] = useState(false);

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
    let result = [...profiles];

    // Filter by brand
    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.tiktokId.toLowerCase().includes(term));
    }

    return result;
  }, [profiles, selectedBrand, searchTerm]);

  // Profiles requiring shipping confirmation (tracking added 5+ days ago, not confirmed)
  const shippingConfirmationRequired = useMemo(() => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const actualRequiredProfiles = filteredProfiles
      .filter((profile) => {
        // Skip if already confirmed
        if (profile.shippingConfirmed) return false;
        
        // Check if any shipping info was added more than 5 days ago
        if (profile.shippingInfo && profile.shippingInfo.length > 0) {
          return profile.shippingInfo.some((info) => {
            if (!info.trackingNumber || !info.addedAt) return false;
            const addedDate = new Date(info.addedAt);
            return addedDate <= fiveDaysAgo;
          });
        }
        return false;
      })
      .map((profile) => {
        // Find the oldest tracking entry
        const oldestTracking = profile.shippingInfo!
          .filter((info) => info.trackingNumber && info.addedAt)
          .sort((a, b) => new Date(a.addedAt!).getTime() - new Date(b.addedAt!).getTime())[0];
        
        const addedDate = new Date(oldestTracking.addedAt!);
        const daysSinceAdded = Math.floor((now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...profile,
          oldestTrackingDate: addedDate,
          daysSinceTracking: daysSinceAdded,
        };
      });

    return actualRequiredProfiles;
  }, [filteredProfiles, hideSampleData]);

  const handleUpdateAmount = async (profile: Profile, amount: number) => {
    try {
      const documentId = `${profile.brand}_${profile.tiktokId}`;
      await updateDocument('profiles', documentId, { contractAmount: amount });
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('Failed to update contract amount');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    // Check if user is admin
    if (appUser?.role !== 'admin') {
      alert('Only admins can delete profiles');
      return;
    }
    
    if (!confirm(`Delete ${selectedIds.size} profile(s)?`)) return;

    try {
      await batchDeleteDocuments('profiles', Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting profiles:', error);
      alert('Failed to delete profiles');
    }
  };

  const handleConfirmShipping = async (profile: any) => {
    try {
      // If it's the sample data, just hide it
      if (profile.tiktokId === 'sample_user_demo') {
        setHideSampleData(true);
        return;
      }

      const documentId = `${profile.brand}_${profile.tiktokId}`;
      await updateDocument('profiles', documentId, {
        shippingConfirmed: true,
        shippingConfirmedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error confirming shipping:', error);
      alert('Failed to confirm shipping');
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
    const path = `contracts/${profile.brand}/${profile.tiktokId}/${timestamp}_${file.name}`;

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
      
      // Use correct document ID: {brand}_{tiktokId}
      const documentId = `${profile.brand}_${profile.tiktokId}`;
      await updateDocument('profiles', documentId, {
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
              className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            />
          ) : null,
        cell: ({ row }) =>
          appUser?.role === 'admin' ? (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
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
                      handleUpdateAmount(row.original, newAmount);
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
                    const documentId = `${row.original.brand}_${row.original.tiktokId}`;
                    updateDocument('profiles', documentId, {
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
                    const documentId = `${row.original.brand}_${row.original.tiktokId}`;
                    updateDocument('profiles', documentId, {
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
      {
        id: 'shippingInfo',
        header: 'Shipping Info',
        cell: ({ row }) => {
          const [shippingList, setShippingList] = useState(
            row.original.shippingInfo || []
          );
          const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

          const handleAdd = () => {
            const newList = [...shippingList, { carrier: '', trackingNumber: '', addedAt: new Date().toISOString() }];
            setShippingList(newList);
            const documentId = `${row.original.brand}_${row.original.tiktokId}`;
            updateDocument('profiles', documentId, {
              shippingInfo: newList,
            });
          };

          const handleUpdate = (index: number, field: 'carrier' | 'trackingNumber', value: string) => {
            const newList = [...shippingList];
            newList[index][field] = value;
            // If tracking number is being added for the first time, set addedAt
            if (field === 'trackingNumber' && value && !newList[index].addedAt) {
              newList[index].addedAt = new Date().toISOString();
            }
            setShippingList(newList);
            const documentId = `${row.original.brand}_${row.original.tiktokId}`;
            updateDocument('profiles', documentId, {
              shippingInfo: newList,
            });
          };

          const handleDelete = (index: number) => {
            const newList = shippingList.filter((_, i) => i !== index);
            setShippingList(newList);
            const documentId = `${row.original.brand}_${row.original.tiktokId}`;
            updateDocument('profiles', documentId, {
              shippingInfo: newList,
            });
          };

          const handleCopy = async (trackingNumber: string, index: number) => {
            try {
              await navigator.clipboard.writeText(trackingNumber);
              setCopiedIndex(index);
              setTimeout(() => setCopiedIndex(null), 2000);
            } catch (error) {
              console.error('Failed to copy:', error);
            }
          };

          const handleSearch = (carrier: string, trackingNumber: string) => {
            const searchQuery = carrier 
              ? `${carrier} ${trackingNumber}` 
              : trackingNumber;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
          };

          const [carrierSearch, setCarrierSearch] = React.useState<Record<number, string>>({});
          
          const carriers = [
            'USPS', 'UPS', 'FedEx', 'Amazon Logistics', 'DHL', 'UniUni', 'OnTrac', 
            'LaserShip', 'GOFO', 'ShipBob', 'Pitney Bowes', 'APC', 'Newgistics', 
            'Lone Star Overnight', 'Eastern Connection', 'R+L Carriers', 'Old Dominion',
            'XPO Logistics', 'Estes Express', 'YRC Freight', 'ABF Freight', 'Saia',
            'TForce Freight', 'Averitt Express', 'Southeastern Freight', 'Central Transport',
            'Dayton Freight', 'Holland', 'New Penn', 'Roadrunner', 'Ward Trucking',
            'A Duie Pyle', 'Forward Air', 'LSO', 'Pilot Freight', 'Pitt Ohio'
          ];

          return (
            <div className="space-y-2 min-w-[280px]">
              {shippingList.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex gap-1">
                    <div className="relative w-20">
                      <input
                        type="text"
                        value={carrierSearch[index] !== undefined ? carrierSearch[index] : item.carrier}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCarrierSearch(prev => ({ ...prev, [index]: value }));
                        }}
                        onBlur={() => {
                          if (carrierSearch[index] !== undefined && carrierSearch[index] !== item.carrier) {
                            handleUpdate(index, 'carrier', carrierSearch[index]);
                          }
                          setCarrierSearch(prev => {
                            const newState = { ...prev };
                            delete newState[index];
                            return newState;
                          });
                        }}
                        placeholder="Carrier"
                        className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500"
                        list={`carriers-${index}`}
                      />
                      <datalist id={`carriers-${index}`}>
                        {carriers
                          .filter(c => c.toLowerCase().includes((carrierSearch[index] || item.carrier || '').toLowerCase()))
                          .map(carrier => (
                            <option key={carrier} value={carrier} />
                          ))
                        }
                      </datalist>
                    </div>
                    <input
                      type="text"
                      value={item.trackingNumber}
                      onChange={(e) => handleUpdate(index, 'trackingNumber', e.target.value)}
                      placeholder="운송장번호"
                      className="flex-1 bg-gray-700 border-gray-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      onClick={() => handleDelete(index)}
                      className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600 text-white"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                  {item.trackingNumber && (
                    <div className="flex gap-1 pl-[84px]">
                      <button
                        onClick={() => handleCopy(item.trackingNumber, index)}
                        className="flex-1 text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                      >
                        {copiedIndex === index ? '✓' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleSearch(item.carrier, item.trackingNumber)}
                        className="flex-1 text-xs px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white transition-colors"
                      >
                        Search
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={handleAdd}
                className="w-full text-xs px-2 py-1.5 rounded border border-dashed border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
              >
                + Add Tracking
              </button>
            </div>
          );
        },
        size: 320,
      },
    ],
    [appUser, videoCountsByProfile, paymentStatsByProfile, uploadingId]
  );

  // Shipping confirmation table columns
  const shippingConfirmationColumns = useMemo<ColumnDef<typeof shippingConfirmationRequired[0]>[]>(
    () => [
      {
        id: 'confirm',
        header: 'Confirm',
        cell: ({ row }) => (
          <input
            type="checkbox"
            onChange={() => handleConfirmShipping(row.original)}
            className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          />
        ),
        size: 80,
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
        accessorKey: 'brand',
        header: 'Brand',
        cell: (info) => (
          <span className="text-cyan-400 font-medium">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'daysSince',
        header: 'Days Since Tracking',
        cell: ({ row }) => (
          <span className="font-semibold text-orange-400">
            D+{row.original.daysSinceTracking}
          </span>
        ),
      },
      {
        id: 'trackingInfo',
        header: 'Tracking Info',
        cell: ({ row }) => (
          <div className="text-sm space-y-2">
            {row.original.shippingInfo?.map((info, idx) => (
              info.trackingNumber && (
                <div key={idx} className="flex items-center gap-2">
                  <div className="text-gray-300">
                    <span className="text-gray-400">{info.carrier || 'N/A'}:</span> {info.trackingNumber}
                  </div>
                  <button
                    onClick={() => {
                      const searchQuery = info.carrier 
                        ? `${info.carrier} ${info.trackingNumber}` 
                        : info.trackingNumber;
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
                    }}
                    className="px-2 py-0.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                    title="Search on Google"
                  >
                    🔍
                  </button>
                </div>
              )
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'oldestTrackingDate',
        header: 'Tracking Added',
        cell: (info) => (
          <span className="whitespace-nowrap text-sm text-gray-400">
            {new Date(info.getValue() as Date).toISOString().split('T')[0]}
          </span>
        ),
      },
    ],
    [handleConfirmShipping]
  );

  const tableState = useTableState();
  const table = createTable({
    data: filteredProfiles,
    columns,
    state: tableState,
    enableRowSelection: appUser?.role === 'admin',
    getRowId: (row) => (row as Profile).tiktokId,
  });

  const shippingTableState = useTableState({ initialPageSize: 10 });
  const shippingTable = createTable({
    data: shippingConfirmationRequired,
    columns: shippingConfirmationColumns,
    state: shippingTableState,
    enableRowSelection: false,
    getRowId: (row) => (row as any).tiktokId,
  });

  // Sync selected rows with state
  React.useEffect(() => {
    const selectedRowIds = new Set(
      table.getSelectedRowModel().rows.map((row) => (row.original as Profile).tiktokId)
    );
    setSelectedIds(selectedRowIds);
  }, [table.getSelectedRowModel().rows]);

  return (
    <>
      <Tutorial page="profiles" />
      <div className="space-y-6 w-full max-w-full">
        {/* Shipping Confirmation Required */}
        <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📦</span>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-yellow-400">
              Action Required: Shipping Confirmation
            </h3>
            <p className="text-sm text-gray-300">
              Tracking numbers were added 5+ days ago. Please confirm delivery status!
            </p>
          </div>
          {shippingConfirmationRequired.length > 0 && (
            <div className="px-3 py-1 bg-yellow-500 text-gray-900 text-sm font-semibold rounded-full">
              {shippingConfirmationRequired.length} pending
            </div>
          )}
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-x-auto">
          <DataTable
            table={shippingTable}
            emptyMessage="All shipments confirmed. Great job! 👍"
          />
        </div>
      </div>

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
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-x-auto w-full">
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
    </>
  );
};
