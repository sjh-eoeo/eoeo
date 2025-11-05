import React, { useState, useMemo, useEffect } from 'react';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { Profile, VideoRecord, Payment, Brand } from '../types';
import Modal from './Modal';
import { DollarIcon } from './icons/DollarIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { SearchIcon } from './icons/SearchIcon';

interface AddPaymentFormProps {
    onSave: (data: { amount: number; paymentDate: string; invoiceFile: File | null; }) => void;
    initialAmount: number;
}

const AddPaymentForm: React.FC<AddPaymentFormProps> = ({ onSave, initialAmount }) => {
    const [amount, setAmount] = useState(initialAmount > 0 ? String(initialAmount) : '');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            amount: Number(amount),
            paymentDate,
            invoiceFile,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">Payment Amount</label>
                <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                    placeholder="0"
                    required
                />
            </div>
             <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-300 mb-2">Payment Date</label>
                <input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="invoice" className="block text-sm font-medium text-gray-300 mb-2">Invoice Attachment</label>
                <input
                    id="invoice"
                    type="file"
                    onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                />
            </div>
             <button type="submit" className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Payment Record
            </button>
        </form>
    );
};


interface PaymentStatusTableProps {
  profiles: Profile[];
  videos: VideoRecord[];
  payments: Payment[];
  brands: Brand[];
  onUpdateProfile: (profile: Profile) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
}

const getNextPaymentDate = (profile: Profile, lastPayment: Payment | null, paymentCount: number): Date | null => {
    if (paymentCount >= 8) return null;

    const baseDate = lastPayment ? new Date(lastPayment.paymentDate) : new Date(profile.startDate);
    
    const dueDate = new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    return dueDate;
};
  

const PaymentStatusTable: React.FC<PaymentStatusTableProps> = ({ profiles, videos, payments, brands, onUpdateProfile, onAddPayment }) => {
  const [editingInfo, setEditingInfo] = useState<{ tiktokId: string; value: string } | null>(null);
  const [saveInfoConfirm, setSaveInfoConfirm] = useState<(() => void) | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [addPaymentModalProfileId, setAddPaymentModalProfileId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<Omit<Payment, 'id'> | null>(null);
  const [dueSortConfig, setDueSortConfig] = useState<{ key: 'nextPaymentDate' | 'tiktokId', direction: 'asc' | 'desc' }>({ key: 'nextPaymentDate', direction: 'asc' });
  const [dueSearchTerm, setDueSearchTerm] = useState('');
  const [overviewSearchTerm, setOverviewSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);


  useEffect(() => {
    if (!activeBrand && brands.length > 0) {
      setActiveBrand(brands[0]);
    } else if (brands.length > 0 && activeBrand && !brands.includes(activeBrand)) {
      setActiveBrand(brands[0]);
    } else if (brands.length === 0) {
      setActiveBrand(null);
    }
  }, [brands, activeBrand]);

  const profileForPaymentModal = useMemo(() => {
    return addPaymentModalProfileId ? profiles.find(p => p.tiktokId === addPaymentModalProfileId) : null;
  }, [addPaymentModalProfileId, profiles]);


  const videoCountsByProfileAndBrand = useMemo(() => {
    const counts = new Map<string, Map<Brand, number>>();
    videos.forEach(video => {
        if (!counts.has(video.tiktokId)) {
            counts.set(video.tiktokId, new Map<Brand, number>());
        }
        const brandCounts = counts.get(video.tiktokId)!;
        brandCounts.set(video.brand, (brandCounts.get(video.brand) || 0) + 1);
    });
    return counts;
  }, [videos]);

  const paymentsByProfile = useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach(p => {
        if (!map.has(p.tiktokId)) map.set(p.tiktokId, []);
        map.get(p.tiktokId)!.push(p);
    });
    return map;
  }, [payments]);

  const dueProfiles = useMemo(() => {
    if (!activeBrand) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueProfilesData = profiles
        .map(profile => {
            const profilePayments = paymentsByProfile.get(profile.tiktokId) || [];
            const paymentCount = profilePayments.length;
            const lastPayment = paymentCount > 0
                ? [...profilePayments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
                : null;
            const nextPaymentDate = getNextPaymentDate(profile, lastPayment, paymentCount);
            
            let isDueByDate = false;
            if (nextPaymentDate && nextPaymentDate.getTime() <= today.getTime()) {
                isDueByDate = true;
            }

            const requiredVideos = (paymentCount + 1) * 12;
            const brandVideoCount = videoCountsByProfileAndBrand.get(profile.tiktokId)?.get(activeBrand) || 0;
            const hasEnoughVideos = brandVideoCount >= requiredVideos;
            
            const isDue = isDueByDate && hasEnoughVideos;
            
            return {
                profile,
                isDue,
                nextPaymentDate,
            };
        })
        .filter(p => p.isDue);

    if (dueSearchTerm.trim() !== '') {
        dueProfilesData = dueProfilesData.filter(p =>
            p.profile.tiktokId.toLowerCase().includes(dueSearchTerm.toLowerCase())
        );
    }
    
    return dueProfilesData.map(p => ({ ...p.profile, nextPaymentDate: p.nextPaymentDate }));
  }, [profiles, paymentsByProfile, videoCountsByProfileAndBrand, activeBrand, dueSearchTerm]);

  const sortedDueProfiles = useMemo(() => {
      let sortableItems = [...dueProfiles];
      if (dueSortConfig !== null) {
          sortableItems.sort((a, b) => {
              const key = dueSortConfig.key;
              let aValue, bValue;

              if (key === 'nextPaymentDate') {
                  aValue = a.nextPaymentDate ? a.nextPaymentDate.getTime() : 0;
                  bValue = b.nextPaymentDate ? b.nextPaymentDate.getTime() : 0;
              } else {
                  aValue = a.tiktokId.toLowerCase();
                  bValue = b.tiktokId.toLowerCase();
              }
              if (aValue < bValue) return dueSortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return dueSortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return sortableItems;
  }, [dueProfiles, dueSortConfig]);

  const overviewProfiles = useMemo(() => {
    if (!activeBrand) return [];
    let filteredProfiles = profiles.filter(p => {
        const profileBrandCounts = videoCountsByProfileAndBrand.get(p.tiktokId);
        return profileBrandCounts && profileBrandCounts.has(activeBrand);
    });

    if (overviewSearchTerm.trim() !== '') {
        filteredProfiles = filteredProfiles.filter(p =>
            p.tiktokId.toLowerCase().includes(overviewSearchTerm.toLowerCase())
        );
    }

    return filteredProfiles;
  }, [profiles, activeBrand, videoCountsByProfileAndBrand, overviewSearchTerm]);

  const requestDueSort = (key: 'nextPaymentDate' | 'tiktokId') => {
      let direction: 'asc' | 'desc' = 'asc';
      if (dueSortConfig && dueSortConfig.key === key && dueSortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setDueSortConfig({ key, direction });
  };

  const getOverdueDisplay = (dueDate: Date | undefined | null): { text: string; color: string } => {
      if (!dueDate) return { text: 'N/A', color: 'text-gray-400' };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (overdueDays > 0) return { text: `${overdueDays} day(s) overdue`, color: 'text-red-400' };
      if (overdueDays === 0) return { text: 'Due Today', color: 'text-orange-400' };
      return { text: 'N/A', color: 'text-gray-400' };
  };


  const getContractDuration = (startDate: string): string => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    if (now < start) return 'Starts soon';
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return `${weeks}w ${days}d`;
  };
  
  const getDaysUntilPayment = (nextPaymentDate: Date | null): { text: string; color: string } => {
    if (!nextPaymentDate) return { text: 'N/A', color: 'text-gray-400' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = nextPaymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 3) return { text: `D-${diffDays}`, color: 'text-green-400' };
    if (diffDays > 0) return { text: `D-${diffDays}`, color: 'text-yellow-400' };
    if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-400' };
    return { text: `Overdue ${-diffDays}d`, color: 'text-red-400' };
  };
  
  const handleSaveInfo = () => {
    if(editingInfo) {
      setSaveInfoConfirm(() => () => {
          const profileToUpdate = profiles.find(p => p.tiktokId === editingInfo.tiktokId);
          if (profileToUpdate) {
            onUpdateProfile({ ...profileToUpdate, paymentInfo: editingInfo.value });
          }
          setEditingInfo(null);
          setSaveInfoConfirm(null);
      });
    }
  }

  const handleCancelEdit = () => {
    setEditingInfo(null);
  };

  const handleSavePayment = async (data: { amount: number; paymentDate: string; invoiceFile: File | null; }) => {
    if (addPaymentModalProfileId) {
        let paymentData: Omit<Payment, 'id'> = {
            tiktokId: addPaymentModalProfileId,
            amount: data.amount,
            paymentDate: data.paymentDate,
        };

        if (data.invoiceFile) {
            setIsUploading(true);
            const file = data.invoiceFile;
            const filePath = `invoices/${addPaymentModalProfileId}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            try {
                await uploadBytes(storageRef, file);
                paymentData.invoiceFileName = file.name;
                paymentData.invoiceFilePath = filePath;
            } catch (error) {
                console.error("Error uploading invoice:", error);
                alert("Invoice upload failed.");
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }
        setPendingPayment(paymentData);
        setAddPaymentModalProfileId(null);
    }
  };

  const handleConfirmSavePayment = () => {
      if (pendingPayment) {
          onAddPayment(pendingPayment);
          setPendingPayment(null);
      }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center">
            Action Required: Payments Due
          </h3>
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                  type="text"
                  placeholder="Search TikTok ID..."
                  value={dueSearchTerm}
                  onChange={(e) => setDueSearchTerm(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-64"
              />
          </div>
        </div>
        <div className="px-4 pt-3 border-b border-gray-700">
          <div className="flex space-x-1">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeBrand === brand
                    ? 'bg-gray-700 text-white'
                    : 'bg-transparent text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {brand.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {activeBrand ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                  <tr>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestDueSort('tiktokId')}>
                          <div className="flex items-center">
                              TikTok ID
                              {dueSortConfig?.key === 'tiktokId' && (dueSortConfig.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3 ml-1.5"/> : <ArrowDownIcon className="w-3 h-3 ml-1.5"/>)}
                          </div>
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestDueSort('nextPaymentDate')}>
                          <div className="flex items-center">
                              Next Due
                              {dueSortConfig?.key === 'nextPaymentDate' && (dueSortConfig.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3 ml-1.5"/> : <ArrowDownIcon className="w-3 h-3 ml-1.5"/>)}
                          </div>
                      </th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Amount Due</th>
                      <th scope="col" className="px-6 py-3">Payment Info</th>
                      <th scope="col" className="px-6 py-3 text-center">Actions</th>
                  </tr>
              </thead>
               <tbody>
                  {sortedDueProfiles.map(profile => {
                      const overdue = getOverdueDisplay(profile.nextPaymentDate);
                      return (
                          <tr key={profile.tiktokId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-2 font-medium text-white whitespace-nowrap">{profile.tiktokId}</td>
                              <td className="px-6 py-2 whitespace-nowrap font-semibold">{profile.nextPaymentDate?.toISOString().split('T')[0]}</td>
                              <td className={`px-6 py-2 font-bold ${overdue.color}`}>{overdue.text}</td>
                              <td className="px-6 py-2 font-semibold text-base">${(profile.contractAmount / 8).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-6 py-2 text-xs">{profile.paymentInfo}</td>
                              <td className="px-6 py-2 text-center">
                                  <button onClick={() => setAddPaymentModalProfileId(profile.tiktokId)} className="flex items-center justify-center mx-auto bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 text-xs font-bold py-1 px-3 rounded-md transition">
                                      <PlusIcon className="h-4 w-4 mr-1"/> Add Payment
                                  </button>
                              </td>
                          </tr>
                      );
                  })}
               </tbody>
            </table>
            {sortedDueProfiles.length === 0 && <p className="text-gray-400 text-center p-6">No payments are due for {activeBrand.toUpperCase()} based on current filters.</p>}
          </div>
        ) : <p className="text-gray-400 text-center p-6">Please add a brand in settings to see payment information.</p>}
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
           <h3 className="text-xl font-semibold text-white flex items-center">
                <DollarIcon className="h-6 w-6 mr-3 text-cyan-400" />
                Payment Status Overview
            </h3>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search TikTok ID..."
                    value={overviewSearchTerm}
                    onChange={(e) => setOverviewSearchTerm(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 w-64"
                />
            </div>
        </div>
        {activeBrand ? (
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                <tr>
                    <th scope="col" className="px-6 py-3">TikTok ID</th>
                    <th scope="col" className="px-6 py-3 text-center">Videos ({activeBrand.toUpperCase()})</th>
                    <th scope="col" className="px-6 py-3">Since</th>
                    <th scope="col" className="px-6 py-3">Next Due</th>
                    <th scope="col" className="px-6 py-3">Payment Info</th>
                    <th scope="col" className="px-6 py-3">Last Payment Date</th>
                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
                </thead>
                <tbody>
                {overviewProfiles.map(profile => {
                    const isEditing = editingInfo?.tiktokId === profile.tiktokId;
                    const profilePayments = paymentsByProfile.get(profile.tiktokId) || [];
                    const lastPayment = profilePayments.length > 0 
                    ? [...profilePayments].sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
                    : null;
                    const nextPaymentDate = getNextPaymentDate(profile, lastPayment, profilePayments.length);
                    const daysUntil = getDaysUntilPayment(nextPaymentDate);
                    
                    const videoCount = videoCountsByProfileAndBrand.get(profile.tiktokId)?.get(activeBrand) || 0;

                    return (
                    <tr key={profile.tiktokId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-2 font-medium text-white whitespace-nowrap">{profile.tiktokId}</td>
                        <td className="px-6 py-2 text-center font-semibold text-sm">{videoCount}</td>
                        <td className="px-6 py-2">{getContractDuration(profile.startDate)}</td>
                        <td className={`px-6 py-2 font-bold ${daysUntil.color}`}>{daysUntil.text}</td>
                        <td className="px-6 py-2">
                        <div className="flex items-center space-x-2">
                            <textarea
                                value={isEditing ? editingInfo.value : (profile.paymentInfo || '')}
                                onChange={(e) => setEditingInfo({ tiktokId: profile.tiktokId, value: e.target.value })}
                                className="bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-xs text-white focus:ring-1 focus:ring-cyan-500 w-full min-w-40"
                                placeholder="PayPal ID, etc..."
                                rows={1}
                            />
                            {isEditing && (
                                <>
                                    <button onClick={handleSaveInfo} className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1 px-2 rounded">Save</button>
                                    <button onClick={handleCancelEdit} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded">Cancel</button>
                                </>
                            )}
                        </div>
                        </td>
                        <td className="px-6 py-2">{lastPayment?.paymentDate || 'N/A'}</td>
                        <td className="px-6 py-2 text-center">
                        <button onClick={() => setAddPaymentModalProfileId(profile.tiktokId)} className="flex items-center justify-center mx-auto bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 text-xs font-bold py-1 px-3 rounded-md transition">
                            <PlusIcon className="h-4 w-4 mr-1"/> Add Payment
                        </button>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            {overviewProfiles.length === 0 && <p className="text-gray-400 text-center p-6">No profiles match the current filter for {activeBrand.toUpperCase()}.</p>}
            </div>
        ) : <p className="text-gray-400 text-center p-6">Please add a brand in settings to see payment information.</p>}
      </div>
      <Modal isOpen={!!saveInfoConfirm} onClose={() => setSaveInfoConfirm(null)} title="Confirm Edit" size="sm">
          <div className="space-y-4">
            <p>Are you sure you want to save this information?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setSaveInfoConfirm(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                Cancel
              </button>
              <button onClick={saveInfoConfirm!} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md">
                Confirm
              </button>
            </div>
          </div>
      </Modal>

      <Modal isOpen={!!addPaymentModalProfileId} onClose={() => setAddPaymentModalProfileId(null)} title={`Add Payment for ${addPaymentModalProfileId}`}>
          {profileForPaymentModal && (
            <AddPaymentForm 
                onSave={handleSavePayment} 
                initialAmount={profileForPaymentModal.contractAmount / 8}
            />
          )}
      </Modal>

      <Modal isOpen={!!pendingPayment} onClose={() => setPendingPayment(null)} title="Confirm Save" size="sm">
          <div className="space-y-4">
            <p>Are you sure you want to save this payment record?</p>
             {isUploading && <p className="text-yellow-400 text-sm">Uploading invoice...</p>}
            <div className="flex justify-end space-x-3">
              <button onClick={() => setPendingPayment(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                Cancel
              </button>
              <button onClick={handleConfirmSavePayment} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md">
                Confirm
              </button>
            </div>
          </div>
      </Modal>
    </div>
  );
};

export default PaymentStatusTable;