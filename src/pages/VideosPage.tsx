import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useVideoStore } from '../store/useVideoStore';
import { useBrandStore } from '../store/useBrandStore';
import { useAuthStore } from '../store/useAuthStore';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { VideoForm } from '../components/features/videos/VideoForm';
import { useTableState, createTable } from '../hooks/useTableState';
import { useFirestore } from '../hooks/useFirestore';
import { Tutorial } from '../components/ui/Tutorial';
import type { VideoRecord } from '../types';

export const VideosPage: React.FC = () => {
  const { videos } = useVideoStore();
  const { selectedBrand } = useBrandStore();
  const { appUser } = useAuthStore();
  const { updateDocument, batchDeleteDocuments } = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gmvModalOpen, setGmvModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);

  const filteredVideos = useMemo(() => {
    let result = videos;

    // Filter by brand
    if (selectedBrand) {
      result = result.filter((v) => v.brand === selectedBrand);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.tiktokId.toLowerCase().includes(term) ||
          v.videoId.toLowerCase().includes(term)
      );
    }

    return result;
  }, [videos, selectedBrand, searchTerm]);

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      await updateDocument('videos', id, { notes });
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes');
    }
  };

  const handleOpenGmvModal = (video: VideoRecord) => {
    setSelectedVideo(video);
    setGmvModalOpen(true);
  };

  const handleUpdateGmvBoost = async (
    enabled: boolean,
    dailyBudget?: number,
    duration?: number
  ) => {
    if (!selectedVideo) return;

    try {
      await updateDocument('videos', selectedVideo.id, {
        gmvBoost: {
          enabled,
          dailyBudget,
          duration,
        },
      });
      setGmvModalOpen(false);
      setSelectedVideo(null);
    } catch (error) {
      console.error('Error updating GMV boost:', error);
      alert('Failed to update GMV boost');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    // Check if user is admin
    if (appUser?.role !== 'admin') {
      alert('Only admins can delete videos');
      return;
    }
    
    if (!confirm(`Delete ${selectedIds.size} video(s)?`)) return;

    try {
      await batchDeleteDocuments('videos', Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting videos:', error);
      alert('Failed to delete videos');
    }
  };

  const columns = useMemo<ColumnDef<VideoRecord>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          />
        ),
        size: 50,
      },
      {
        accessorKey: 'tiktokId',
        header: 'TikTok ID',
        cell: ({ row }) => {
          const tiktokId = row.original.tiktokId;
          const profileUrl = row.original.tiktokProfileUrl || `https://www.tiktok.com/@${tiktokId}`;
          return (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline whitespace-nowrap cursor-pointer"
            >
              {tiktokId}
            </a>
          );
        },
      },
      {
        accessorKey: 'videoId',
        header: 'Video ID',
        cell: ({ row }) => {
          const videoId = row.original.videoId;
          const tiktokId = row.original.tiktokId;
          const videoUrl = row.original.videoUrl || `https://www.tiktok.com/@${tiktokId}/video/${videoId}`;
          return (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              {videoId}
            </a>
          );
        },
      },
      {
        accessorKey: 'uploadDate',
        header: 'Upload Date',
        cell: (info) => (
          <span className="whitespace-nowrap">{info.getValue() as string}</span>
        ),
      },
      {
        id: 'gmvBoost',
        header: 'GMV Boost',
        cell: ({ row }) => {
          const video = row.original;
          const isEnabled = video.gmvBoost?.enabled || false;
          const dailyBudget = video.gmvBoost?.dailyBudget;
          const duration = video.gmvBoost?.duration;

          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col min-w-[80px]">
                <span
                  className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded ${
                    isEnabled
                      ? 'bg-green-900 text-green-300 border border-green-700'
                      : 'bg-gray-700 text-gray-400 border border-gray-600'
                  }`}
                >
                  {isEnabled ? 'Active' : 'Inactive'}
                </span>
                {isEnabled && dailyBudget && duration && (
                  <span className="text-xs text-gray-400 mt-1 text-center">
                    ₩{dailyBudget.toLocaleString()}/day
                  </span>
                )}
              </div>
              <button
                onClick={() => handleOpenGmvModal(video)}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                {isEnabled ? 'Edit' : 'Setup'}
              </button>
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => {
          const [notes, setNotes] = useState(row.original.notes || '');

          return (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== row.original.notes) {
                  handleUpdateNotes(row.original.id, notes);
                }
              }}
              className="bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 w-full min-w-[200px]"
              placeholder="Add notes..."
              rows={2}
            />
          );
        },
        size: 300,
      },
    ],
    []
  );

  const tableState = useTableState();
  const table = createTable({
    data: filteredVideos,
    columns,
    state: tableState,
    enableRowSelection: appUser?.role === 'admin',
    getRowId: (row) => (row as VideoRecord).id,
  });

  // Sync selected rows with state
  React.useEffect(() => {
    const selectedRowIds = new Set(
      table.getSelectedRowModel().rows.map((row) => (row.original as VideoRecord).id)
    );
    setSelectedIds(selectedRowIds);
  }, [table.getSelectedRowModel().rows]);

  return (
    <>
      <Tutorial page="videos" />
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Video Management
          </h2>
          {appUser?.role === 'admin' && selectedIds.size > 0 && (
            <p className="text-sm text-cyan-400">
              {selectedIds.size} item(s) selected
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search TikTok or Video ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            data-tour="search-bar"
          />

          {appUser?.role === 'admin' && selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteSelected} data-tour="delete-selected">
              Delete Selected ({selectedIds.size})
            </Button>
          )}

          <Button size="md" onClick={() => setIsModalOpen(true)} data-tour="add-video-btn">
            + Add Video
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden" data-tour="videos-table">
        <DataTable
          table={table}
          emptyMessage="No videos found. Try adjusting your filters."
        />
      </div>

      {/* Add Video Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Video Record"
        size="md"
      >
        <VideoForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>

      {/* GMV Boost Modal */}
      {selectedVideo && (
        <Modal
          isOpen={gmvModalOpen}
          onClose={() => {
            setGmvModalOpen(false);
            setSelectedVideo(null);
          }}
          title="GMV Boost Settings"
          size="md"
        >
          <GmvBoostForm
            video={selectedVideo}
            onSave={handleUpdateGmvBoost}
            onCancel={() => {
              setGmvModalOpen(false);
              setSelectedVideo(null);
            }}
          />
        </Modal>
      )}
      </div>
    </>
  );
};

// GMV Boost Form Component
interface GmvBoostFormProps {
  video: VideoRecord;
  onSave: (enabled: boolean, dailyBudget?: number, duration?: number) => void;
  onCancel: () => void;
}

const GmvBoostForm: React.FC<GmvBoostFormProps> = ({ video, onSave, onCancel }) => {
  const [isEnabled, setIsEnabled] = useState(video.gmvBoost?.enabled || false);
  const [dailyBudget, setDailyBudget] = useState(
    String(video.gmvBoost?.dailyBudget || '')
  );
  const [duration, setDuration] = useState(String(video.gmvBoost?.duration || ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEnabled && (!dailyBudget || !duration)) {
      alert('Please enter both daily budget and duration to enable GMV Boost');
      return;
    }

    onSave(
      isEnabled,
      dailyBudget ? Number(dailyBudget) : undefined,
      duration ? Number(duration) : undefined
    );
  };

  const totalBudget = dailyBudget && duration
    ? Number(dailyBudget) * Number(duration)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      {/* Video Info */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">TikTok ID:</span>
          <span className="text-white font-medium">{video.tiktokId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Video ID:</span>
          <span className="text-white font-medium">{video.videoId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Upload Date:</span>
          <span className="text-white">{video.uploadDate}</span>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="gmv-enabled"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="w-5 h-5 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        />
        <label htmlFor="gmv-enabled" className="text-white font-medium cursor-pointer">
          Enable GMV Boost
        </label>
        <span
          className={`ml-auto px-3 py-1 text-xs font-medium rounded ${
            isEnabled
              ? 'bg-green-900 text-green-300'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {isEnabled ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Budget Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Daily Budget (₩)
          </label>
          <input
            type="number"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value)}
            placeholder="10,000"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duration (days)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="7"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            min="1"
          />
        </div>
      </div>

      {/* Total Budget Display */}
      {dailyBudget && duration && (
        <div className="bg-cyan-900 bg-opacity-30 border border-cyan-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-cyan-300 font-medium">Total Budget:</span>
            <span className="text-white text-xl font-bold">
              ₩{totalBudget.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-cyan-400 mt-1">
            ₩{Number(dailyBudget).toLocaleString()} × {duration} days
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
};
