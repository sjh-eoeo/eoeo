import React, { useState, useMemo } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Profile, Payment } from '../types';
import Modal from './Modal';
import { SearchIcon } from './icons/SearchIcon';
import { EyeIcon } from './icons/EyeIcon';

interface DocsPageProps {
  profiles: Profile[];
  payments: Payment[];
  onViewFile: (filePath: string, fileName: string) => void;
}

const DocsPage: React.FC<DocsPageProps> = ({ profiles, payments, onViewFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const tableData = useMemo(() => {
    const paymentsByTiktokId = new Map<string, number>();
    payments.forEach(p => {
      paymentsByTiktokId.set(p.tiktokId, (paymentsByTiktokId.get(p.tiktokId) || 0) + p.amount);
    });

    return profiles.map(profile => ({
      profile,
      totalPaid: paymentsByTiktokId.get(profile.tiktokId) || 0,
    }));
  }, [profiles, payments]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return tableData;
    }
    return tableData.filter(data =>
      data.profile.tiktokId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tableData, searchTerm]);
  
  const documentsForSelectedProfile = useMemo(() => {
    if (!selectedProfile) return [];

    const documents: { name: string; path: string; type: 'Contract' | 'Invoice' }[] = [];

    // Add contract
    if (selectedProfile.contractFileName && selectedProfile.contractFilePath) {
      documents.push({
        name: selectedProfile.contractFileName,
        path: selectedProfile.contractFilePath,
        type: 'Contract',
      });
    }

    // Add invoices
    const profilePayments = payments.filter(p => p.tiktokId === selectedProfile.tiktokId);
    profilePayments.forEach(p => {
      if (p.invoiceFileName && p.invoiceFilePath) {
        documents.push({
          name: p.invoiceFileName,
          path: p.invoiceFilePath,
          type: 'Invoice',
        });
      }
    });

    return documents;
  }, [selectedProfile, payments]);

  const handleViewDocs = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDocsModalOpen(true);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
        const url = await getDownloadURL(ref(storage, filePath));
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        alert("Could not download the file.");
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Documents Hub</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search TikTok ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 rounded-md pl-9 pr-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">TikTok ID</th>
                <th scope="col" className="px-6 py-3">Total Paid Amount</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(({ profile, totalPaid }) => (
                <tr key={profile.tiktokId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{profile.tiktokId}</td>
                  <td className="px-6 py-4 font-semibold">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewDocs(profile)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center mx-auto text-xs font-semibold"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Docs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <p className="text-gray-400 text-center p-6">
              No profiles match your search or no profiles have been added.
            </p>
          )}
        </div>
      </div>
      
      {selectedProfile && (
        <Modal
          isOpen={isDocsModalOpen}
          onClose={() => setIsDocsModalOpen(false)}
          title={`Documents for ${selectedProfile.tiktokId}`}
          size="2xl"
        >
          {documentsForSelectedProfile.length > 0 ? (
            <ul className="space-y-3">
              {documentsForSelectedProfile.map((doc, index) => (
                <li key={index} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-3 ${doc.type === 'Contract' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                      {doc.type}
                    </span>
                    <span className="font-medium text-white">{doc.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewFile(doc.path, doc.name)}
                      className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-md transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc.path, doc.name)}
                      className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1 px-3 rounded-md transition"
                    >
                      Download
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">No documents found for this profile.</p>
          )}
        </Modal>
      )}
    </>
  );
};

export default DocsPage;