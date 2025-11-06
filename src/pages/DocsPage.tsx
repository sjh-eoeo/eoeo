import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useProfileStore } from '../store/useProfileStore';
import { useStorage } from '../hooks/useStorage';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { useTableState, createTable } from '../hooks/useTableState';
import type { Profile, ContractFile } from '../types';

interface ProfileWithFiles extends Profile {
  fileCount: number;
}

export const DocsPage: React.FC = () => {
  const { profiles } = useProfileStore();
  const { getFileURL } = useStorage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get profiles with files
  const profilesWithFiles = useMemo(() => {
    return profiles
      .filter((p) => p.contractFiles && p.contractFiles.length > 0)
      .map((p) => ({
        ...p,
        fileCount: p.contractFiles?.length || 0,
      }));
  }, [profiles]);

  // Filter profiles by search term
  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim()) return profilesWithFiles;
    const term = searchTerm.toLowerCase();
    return profilesWithFiles.filter((p) =>
      p.tiktokId.toLowerCase().includes(term)
    );
  }, [profilesWithFiles, searchTerm]);

  const handleViewFiles = (profile: Profile) => {
    setSelectedProfile(profile);
    setSelectedFile('');
    setFileURL(null);
    setIsModalOpen(true);
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoading(true);
    try {
      const url = await getFileURL(filePath);
      setFileURL(url);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load file');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<ProfileWithFiles>[]>(
    () => [
      {
        accessorKey: 'tiktokId',
        header: 'TikTok ID',
        cell: (info) => (
          <span className="font-medium text-white">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'fileCount',
        header: 'Contract Files',
        cell: (info) => (
          <span className="text-cyan-400 font-semibold">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Contract Start',
        cell: (info) => info.getValue() as string,
      },
      {
        accessorKey: 'contractAmount',
        header: 'Contract Amount',
        cell: (info) => (
          <span className="font-semibold">
            ${(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleViewFiles(row.original)}
          >
            View Files
          </Button>
        ),
      },
    ],
    []
  );

  const tableState = useTableState();
  const table = createTable({
    data: filteredProfiles,
    columns,
    state: tableState,
    getRowId: (row) => (row as ProfileWithFiles).tiktokId,
  });

  const selectedFileName = useMemo(() => {
    if (!selectedProfile || !selectedFile) return '';
    const file = selectedProfile.contractFiles?.find(
      (f) => f.filePath === selectedFile
    );
    return file?.fileName || '';
  }, [selectedProfile, selectedFile]);

  if (profilesWithFiles.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">Documents</h2>
        <p className="text-gray-400 text-center py-12">
          No documents uploaded yet. Upload contract files from the Profiles page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-white mb-2">Documents</h2>
          <p className="text-sm text-gray-400">
            View and manage contract files by profile
          </p>
        </div>
        <SearchBar
          placeholder="Search TikTok ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <DataTable
          table={table}
          emptyMessage="No documents found. Try adjusting your search."
        />
      </div>

      {/* File Viewer Modal */}
      {isModalOpen && selectedProfile && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProfile(null);
            setSelectedFile('');
            setFileURL(null);
          }}
          title={`Files for ${selectedProfile.tiktokId}`}
          size="4xl"
        >
          <div className="space-y-4">
            {/* File Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File
              </label>
              <select
                value={selectedFile}
                onChange={(e) => handleFileSelect(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Select a file --</option>
                {selectedProfile.contractFiles?.map((file) => (
                  <option key={file.filePath} value={file.filePath}>
                    {file.fileName} ({new Date(file.uploadedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* File Viewer */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-400">Loading file...</p>
              </div>
            ) : fileURL && selectedFileName ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedFileName}
                  </h3>
                  <a
                    href={fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    Open in new tab
                  </a>
                </div>
                <div className="w-full bg-gray-900 rounded-lg p-4" style={{ height: '600px' }}>
                  {selectedFileName.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={fileURL}
                      className="w-full h-full border-0 rounded"
                      title={selectedFileName}
                    />
                  ) : (
                    <img
                      src={fileURL}
                      alt={selectedFileName}
                      className="w-full h-full object-contain rounded"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-400">
                Select a file to view
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
