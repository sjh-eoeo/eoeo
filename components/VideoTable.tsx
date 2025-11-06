import React, { useState, useMemo } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { VideoRecord, AppUser } from '../types';
import Modal from './Modal';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon';
import { SearchIcon } from './icons/SearchIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';


interface VideoDataTableProps {
  videos: VideoRecord[];
  onUpdateVideo: (video: VideoRecord) => void;
  appUser: AppUser;
  onDeleteVideos: (ids: string[]) => void;
  onViewFile: (filePath: string, fileName: string) => void;
}

type SortKey = keyof Omit<VideoRecord, 'notes'>;


const COLUMNS = [
    { id: 'tiktokId', name: 'TikTok ID' },
    { id: 'videoId', name: 'Video ID' },
    { id: 'uploadDate', name: 'Upload Date' },
    { id: 'videoFile', name: 'Video File' },
    { id: 'notes', name: 'Notes' },
];

const SORTABLE_KEYS: SortKey[] = ['tiktokId', 'videoId', 'uploadDate'];


// --- Helper Components ---

const EditableNotesCell: React.FC<{ video: VideoRecord; onUpdate: (video: VideoRecord) => void; }> = ({ video, onUpdate }) => {
    const [notes, setNotes] = useState(video.notes);
    
    const handleBlur = () => {
        if (notes !== video.notes) {
            onUpdate({ ...video, notes });
        }
    };

    return (
        <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleBlur}
            className="bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 w-full min-w-[200px]"
            placeholder="Add notes..."
            rows={2}
        />
    );
};

// --- Main Component ---

const VideoDataTable: React.FC<VideoDataTableProps> = ({ videos, onUpdateVideo, appUser, onDeleteVideos, onViewFile }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(COLUMNS.map(c => c.id)));
  const [isColsDropdownOpen, setIsColsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // Track by video ID

  const filteredAndSortedVideos = useMemo(() => {
    let filteredVideos = [...videos];

    // Brand filter removed as per instruction
    
    if (searchTerm.trim() !== '') {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        filteredVideos = filteredVideos.filter(v => 
            v.tiktokId.toLowerCase().includes(lowercasedSearchTerm) ||
            v.videoId.toLowerCase().includes(lowercasedSearchTerm)
        );
    }

    if (sortConfig !== null) {
      filteredVideos.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredVideos;
  }, [videos, sortConfig, searchTerm]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredAndSortedVideos.map(v => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };
  
  const toggleColumn = (id: string) => {
      const newVisible = new Set(visibleColumns);
      if(newVisible.has(id)) newVisible.delete(id);
      else newVisible.add(id);
      setVisibleColumns(newVisible);
  }

  const handleConfirmDelete = () => {
    onDeleteVideos(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsDeleteModalOpen(false);
  };
  
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, video: VideoRecord) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(video.id);
            const filePath = `videos/${video.tiktokId}/${video.videoId}/${file.name}`;
            const storageRef = ref(storage, filePath);
            try {
                await uploadBytes(storageRef, file);
                onUpdateVideo({
                    ...video,
                    videoFileName: file.name,
                    videoFilePath: filePath,
                });
            } catch (error) {
                console.error("Video upload error: ", error);
                alert("Failed to upload video.");
            } finally {
                setUploading(null);
            }
        }
    };
  
  const ColumnManager = () => (
      <div className="relative">
          <button onClick={() => setIsColsDropdownOpen(!isColsDropdownOpen)} className="flex items-center space-x-2 text-sm text-gray-300 bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-600">
              <AdjustmentsIcon className="h-5 w-5" />
              <span>Columns</span>
          </button>
          {isColsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                  {COLUMNS.map(col => (
                    <label key={col.id} className="flex items-center space-x-2 px-3 py-2 text-sm text-white hover:bg-gray-600 cursor-pointer">
                        <input type="checkbox" checked={visibleColumns.has(col.id)} onChange={() => toggleColumn(col.id)} className="h-4 w-4 bg-gray-600 border-gray-500 rounded text-cyan-500 focus:ring-cyan-600"/>
                        <span>{col.name}</span>
                    </label>
                  ))}
              </div>
          )}
      </div>
  )

  return (
    <>
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700">
        <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">Video Records</h3>
            {appUser.role === 'admin' && selectedIds.size > 0 && (
                 <div className="mt-2 flex items-center gap-4">
                     <span className="text-sm font-medium text-cyan-400">{selectedIds.size} item(s) selected</span>
                     <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 text-sm bg-red-600/20 text-red-300 hover:bg-red-600/40 font-semibold py-1 px-3 rounded-md transition"
                    >
                         <TrashIcon className="h-4 w-4" />
                         Delete Selected
                     </button>
                 </div>
            )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search TikTok or Video ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border-gray-600 rounded-md pl-9 pr-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                />
            </div>
           
            <ColumnManager />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="p-4">
                <input type="checkbox" onChange={handleSelectAll} checked={filteredAndSortedVideos.length > 0 && selectedIds.size === filteredAndSortedVideos.length} className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"/>
              </th>
              {COLUMNS.filter(c => visibleColumns.has(c.id)).map(col => {
                const isSortable = SORTABLE_KEYS.includes(col.id as SortKey);
                return (
                    <th key={col.id} scope="col" className={`px-6 py-3 ${isSortable ? 'cursor-pointer' : ''}`} onClick={isSortable ? () => requestSort(col.id as SortKey) : undefined}>
                       <div className="flex items-center">
                        {col.name}
                        {isSortable && sortConfig?.key === col.id && (sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3 ml-1.5"/> : <ArrowDownIcon className="w-3 h-3 ml-1.5"/>)}
                       </div>
                    </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedVideos.map(video => {
              return (
                <tr key={video.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="w-4 p-4">
                     <input type="checkbox" checked={selectedIds.has(video.id)} onChange={() => handleSelectOne(video.id)} className="w-4 h-4 text-cyan-500 bg-gray-900 border-2 border-gray-500 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"/>
                  </td>
                  {visibleColumns.has('tiktokId') && <td className="px-6 py-2 font-medium text-white whitespace-nowrap">{video.tiktokId}</td>}
                  {visibleColumns.has('videoId') && <td className="px-6 py-2">{video.videoId}</td>}
                  
                  {visibleColumns.has('uploadDate') && <td className="px-6 py-2 whitespace-nowrap">{video.uploadDate}</td>}
                  {visibleColumns.has('videoFile') && <td className="px-6 py-2">
                    {uploading === video.id ? (
                        <span className="text-xs text-yellow-400">Uploading...</span>
                    ) : video.videoFilePath && video.videoFileName ? (
                        <button
                            onClick={() => onViewFile(video.videoFilePath!, video.videoFileName!)}
                            className="w-full text-xs bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-cyan-400 hover:bg-gray-600 cursor-pointer flex items-center justify-center font-semibold"
                        >
                            <EyeIcon className="h-4 w-4 mr-1.5" />
                            <span>View Video</span>
                        </button>
                    ) : (
                        <label className="w-full text-xs bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-gray-300 hover:bg-gray-600 cursor-pointer flex items-center justify-center">
                            <span>Upload File</span>
                            <input type="file" className="hidden" onChange={(e) => handleVideoUpload(e, video)} accept="video/*" />
                        </label>
                    )}
                  </td>}
                  {visibleColumns.has('notes') && <td className="px-6 py-2">
                        <EditableNotesCell video={video} onUpdate={onUpdateVideo} />
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedVideos.length === 0 && <p className="text-gray-400 text-center p-6">No videos match the current filters.</p>}
      </div>
    </div>
     {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <div className="space-y-6">
            <p className="text-gray-300">
              Are you sure you want to delete{' '}
              <span className="font-bold text-white">{selectedIds.size}</span> video record(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">
                Delete
              </button>
            </div>
          </div>
        </Modal>
    )}
    </>
  );
};

export default VideoDataTable;