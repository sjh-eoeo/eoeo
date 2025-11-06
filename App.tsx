import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, doc, updateDoc, setDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { VideoRecord, Profile, Brand, Payment, AppUser, UserStatus } from './types';
import VideoForm from './components/VideoForm';
import NewProfileForm from './components/NewProfileForm';
import VideoTable from './components/VideoTable';
import ProfileDataTable from './components/ProfileDataTable';
import PaymentStatusTable from './components/PaymentStatusTable';
import StatsDashboard from './components/StatsDashboard';
import DashboardSummaryCard from './components/DashboardSummaryCard';
import Modal from './components/Modal';
import { DashboardIcon } from './components/icons/DashboardIcon';
import { ListIcon } from './components/icons/ListIcon';
import { UserGroupIcon } from './components/icons/UserGroupIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { DollarIcon } from './components/icons/DollarIcon';
import { CogIcon } from './components/icons/CogIcon';
import { DocumentIcon } from './components/icons/DocumentIcon';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';
import VideoUploadStats from './components/VideoUploadStats';
import SettingsPage from './components/SettingsPage';
import DocsPage from './components/DocsPage';
import FullScreenMessage from './components/FullScreenMessage';
import AdminPage from './components/AdminPage';


interface AppProps {
  user: User;
  appUser: AppUser;
  onSignOut: () => void;
}

const App: React.FC<AppProps> = ({ user, appUser, onSignOut }) => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'video' | 'profile' | null>(null);
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    const videoQuery = query(collection(db, 'videos'));
    const unsubVideos = onSnapshot(videoQuery, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoRecord));
      setVideos(videoData);
      setLoading(false);
    });

    const profileQuery = query(collection(db, 'profiles'));
    const unsubProfiles = onSnapshot(profileQuery, (snapshot) => {
      const profileData = snapshot.docs.map(doc => ({ tiktokId: doc.id, ...doc.data() } as Profile));
      setProfiles(profileData);
    });

    const paymentQuery = query(collection(db, 'payments'));
    const unsubPayments = onSnapshot(paymentQuery, (snapshot) => {
      const paymentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(paymentData);
    });
    
    const brandsDocRef = doc(db, 'config', 'brandsDoc');
    const unsubBrands = onSnapshot(brandsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const brandNames = docSnap.data().names || [];
            setBrands(brandNames);
            if (!selectedBrand && brandNames.length > 0) {
              setSelectedBrand(brandNames[0]);
            }
        } else {
            const defaultBrands = ['kahi', 'marsmade'];
            setDoc(brandsDocRef, { names: defaultBrands });
            setBrands(defaultBrands);
            if (!selectedBrand) {
              setSelectedBrand(defaultBrands[0]);
            }
        }
    });

    let unsubUsers = () => {};
    if (appUser.role === 'admin') {
      const usersQuery = query(collection(db, 'users'));
      unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data() as AppUser);
        setAllUsers(usersData);
      });
    }

    return () => {
      unsubVideos();
      unsubProfiles();
      unsubPayments();
      unsubBrands();
      unsubUsers();
    };
  }, [appUser.role, selectedBrand]);

  const filteredVideos = useMemo(() => {
    if (!selectedBrand) return [];
    return videos.filter(video => video.brand === selectedBrand);
  }, [videos, selectedBrand]);

  const filteredProfiles = useMemo(() => {
    if (!selectedBrand) return profiles;
    const relevantProfileIds = new Set(filteredVideos.map(v => v.tiktokId));
    return profiles.filter(p => relevantProfileIds.has(p.tiktokId));
  }, [profiles, filteredVideos, selectedBrand]);

  const addVideo = async (newVideoData: Omit<VideoRecord, 'id' | 'notes' | 'brand'>) => {
    if (!selectedBrand) {
      alert("Please select a brand first.");
      return;
    }
    try {
      await addDoc(collection(db, 'videos'), { 
        ...newVideoData,
        brand: selectedBrand,
        notes: ''
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding video: ", error);
      alert("Failed to add video record.");
    }
  };

  const updateVideo = async (updatedVideo: VideoRecord) => {
    try {
      const videoRef = doc(db, 'videos', updatedVideo.id);
      const { id, ...videoData } = updatedVideo;
      await updateDoc(videoRef, videoData);
    } catch (error) {
      console.error("Error updating video: ", error);
      alert("Failed to update video.");
    }
  };

  const deleteVideos = async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
        const videoRef = doc(db, 'videos', id);
        batch.delete(videoRef);
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error deleting videos: ", error);
        alert("Failed to delete video records.");
    }
  };

  const addProfile = async (newProfileData: Omit<Profile, 'paymentInfo' | 'contractFileName' | 'contractFilePath'>) => {
    if (profiles.some(p => p.tiktokId === newProfileData.tiktokId)) {
      alert('A profile with this TikTok ID already exists.');
      return;
    }
    try {
      const profileRef = doc(db, 'profiles', newProfileData.tiktokId);
      await setDoc(profileRef, { ...newProfileData, paymentInfo: '' });
      setModalContent(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding profile: ", error);
      alert("Failed to add profile.");
    }
  };
  
  const updateProfile = async (updatedProfile: Profile) => {
    try {
      const profileRef = doc(db, 'profiles', updatedProfile.tiktokId);
      const { tiktokId, ...profileData } = updatedProfile;
      await updateDoc(profileRef, profileData);
    } catch (error) {
      console.error("Error updating profile: ", error);
      alert("Failed to update profile.");
    }
  };
  
  const deleteProfiles = async (tiktokIds: string[]) => {
    const batch = writeBatch(db);
    tiktokIds.forEach(id => {
        const profileRef = doc(db, 'profiles', id);
        batch.delete(profileRef);
    });
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error deleting profiles: ", error);
        alert("Failed to delete profiles.");
    }
  };

  const addPayment = async (newPaymentData: Omit<Payment, 'id'>) => {
    try {
      await addDoc(collection(db, 'payments'), newPaymentData);
    } catch (error) {
      console.error("Error adding payment: ", error);
      alert("Failed to add payment.");
    }
  };

  const addBrand = async (brandName: string) => {
    const newBrand = brandName.trim().toLowerCase();
    if (newBrand && !brands.includes(newBrand)) {
        try {
            const brandsDocRef = doc(db, 'config', 'brandsDoc');
            await updateDoc(brandsDocRef, { names: [...brands, newBrand] });
        } catch (error) {
            console.error("Error adding brand: ", error);
            alert("Failed to add brand.");
        }
    } else {
        alert('Brand already exists or is empty.');
    }
  };

  const removeBrand = async (brandToRemove: string) => {
    try {
      const brandsDocRef = doc(db, 'config', 'brandsDoc');
      await updateDoc(brandsDocRef, { names: brands.filter(b => b !== brandToRemove) });
      if (selectedBrand === brandToRemove) {
        setSelectedBrand(brands.length > 1 ? brands.filter(b => b !== brandToRemove)[0] : null);
      }
    } catch (error) {
      console.error("Error removing brand: ", error);
      alert("Failed to remove brand.");
    }
  };

  const updateUserStatus = async (uid: string, status: UserStatus) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { status });
    } catch (error) {
      console.error("Error updating user status: ", error);
      alert("Failed to update user status.");
    }
  };
  
  const handleViewFile = async (filePath: string, fileName: string) => {
    if (!filePath || !fileName) return;
    try {
      const url = await getDownloadURL(ref(storage, filePath));
      setViewingFile({ name: fileName, url: url });
    } catch (error) {
      console.error("Error getting file URL:", error);
      alert("Could not load file preview.");
    }
  };

  if (loading) {
    return <FullScreenMessage title="Loading Dashboard..." message="Fetching your data from the cloud." />;
  }

  const BrandNavigation = () => (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4">
      {brands.map(brand => (
        <button
          key={brand}
          onClick={() => setSelectedBrand(brand)}
          className={`px-4 py-2 text-sm font-bold rounded-full transition-colors duration-200 ease-in-out whitespace-nowrap ${
            selectedBrand === brand
              ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {brand.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const PageNavigation = () => {
    const navItems = [
      { path: '/', label: 'Dashboard', icon: DashboardIcon },
      { path: '/videos', label: 'Video Management', icon: ListIcon },
      { path: '/profiles', label: 'Profile Management', icon: UserGroupIcon },
      { path: '/payments', label: 'Payment Status', icon: DollarIcon },
      { path: '/docs', label: 'Docs', icon: DocumentIcon },
      { path: '/settings', label: 'Settings', icon: CogIcon },
      ...(appUser.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheckIcon }] : [])
    ];

    return (
      <div className="mb-8">
        <div className="flex space-x-2 border-b border-gray-700">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out -mb-px border-b-2 ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };

  const DashboardPage = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardSummaryCard title="Total Profiles" value={filteredProfiles.length} />
        <DashboardSummaryCard title="Total Videos" value={filteredVideos.length} />
        <VideoUploadStats videos={filteredVideos} />
      </div>
      <StatsDashboard videos={filteredVideos} profiles={filteredProfiles} />
    </div>
  );
  
  const VideoManagementPage = () => (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => { setIsModalOpen(true); setModalContent('video'); }}
          className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Video
        </button>
      </div>
      <VideoTable 
        videos={filteredVideos} 
        onUpdateVideo={updateVideo} 
        appUser={appUser}
        onDeleteVideos={deleteVideos}
        onViewFile={handleViewFile}
      />
    </>
  );

  const ProfileManagementPage = () => (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => { setIsModalOpen(true); setModalContent('profile'); }}
          className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Profile
        </button>
      </div>
      <ProfileDataTable 
        profiles={filteredProfiles} 
        videos={videos} 
        payments={payments}
        onUpdateProfile={updateProfile}
        onViewFile={handleViewFile}
        appUser={appUser}
        onDeleteProfiles={deleteProfiles}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex-grow">
              <BrandNavigation />
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <span className="text-sm text-gray-400 truncate max-w-xs">{user.email}</span>
                <button
                    onClick={onSignOut}
                    className="text-sm bg-gray-700 hover:bg-red-600/80 text-white font-semibold py-1.5 px-4 rounded-md transition"
                >
                    Sign Out
                </button>
            </div>
        </header>

        <PageNavigation />
        
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/videos" element={<VideoManagementPage />} />
            <Route path="/profiles" element={<ProfileManagementPage />} />
            <Route path="/payments" element={<PaymentStatusTable profiles={filteredProfiles} videos={filteredVideos} payments={payments} selectedBrand={selectedBrand} onUpdateProfile={updateProfile} onAddPayment={addPayment} />} />
            <Route path="/docs" element={<DocsPage profiles={profiles} payments={payments} onViewFile={handleViewFile} />} />
            <Route path="/settings" element={<SettingsPage brands={brands} onAddBrand={addBrand} onRemoveBrand={removeBrand} />} />
            {appUser.role === 'admin' && <Route path="/admin" element={<AdminPage users={allUsers} currentUser={appUser} onUpdateUserStatus={updateUserStatus} />} />}
          </Routes>
        </main>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={modalContent === 'video' ? "Add New Video Record" : "Register New Profile"}
        >
          {modalContent === 'video' && <VideoForm onAddVideo={addVideo} profiles={filteredProfiles} />}
          {modalContent === 'profile' && <NewProfileForm onAddProfile={addProfile} />}
        </Modal>

        {viewingFile && (
          <Modal 
            isOpen={!!viewingFile} 
            onClose={() => setViewingFile(null)} 
            title={`Document: ${viewingFile.name}`}
            size="4xl"
          >
            <div className="w-full h-[75vh] bg-white rounded">
              <iframe 
                src={viewingFile.url} 
                title={viewingFile.name}
                className="w-full h-full border-0 rounded"
              />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default App;