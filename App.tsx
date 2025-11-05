import React, { useState, useMemo, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, doc, updateDoc, setDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { VideoRecord, Profile, Brand, Payment, AppUser, UserStatus } from './types';
import VideoForm from './components/VideoForm';
import NewProfileForm from './components/NewProfileForm';
import VideoDataTable from './components/VideoTable';
import ProfileDataTable from './components/ProfileDataTable';
import PaymentStatusTable from './components/PaymentStatusTable';
import StatsDashboard from './components/StatsDashboard';
import DashboardSummaryCard from './components/DashboardSummaryCard';
import Modal from './components/Modal';
import { TikTokIcon } from './components/icons/TikTokIcon';
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


type Page = 'dashboard' | 'videos' | 'profiles' | 'payment' | 'docs' | 'settings' | 'admin';

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
  
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    const videoQuery = query(collection(db, 'videos'));
    const unsubVideos = onSnapshot(videoQuery, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoRecord));
      setVideos(videoData);
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
            setBrands(docSnap.data().names || []);
        } else {
            setDoc(brandsDocRef, { names: ['kahi', 'marsmade'] });
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


    // A simple way to remove the initial loader
    Promise.all([
      new Promise(resolve => setTimeout(resolve, 500)) 
    ]).then(() => setLoading(false));

    return () => {
      unsubVideos();
      unsubProfiles();
      unsubPayments();
      unsubBrands();
      unsubUsers();
    };
  }, [appUser.role]);

  const addVideo = async (newVideoData: Omit<VideoRecord, 'id' | 'notes'>) => {
    try {
      await addDoc(collection(db, 'videos'), { 
        ...newVideoData,
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

  const addProfile = async (newProfileData: Pick<Profile, 'tiktokId' | 'contractAmount' | 'startDate' | 'tiktokProfileLink'>) => {
    if (profiles.some(p => p.tiktokId === newProfileData.tiktokId)) {
      alert('A profile with this TikTok ID already exists.');
      return;
    }
    try {
      const profileRef = doc(db, 'profiles', newProfileData.tiktokId);
      await setDoc(profileRef, { ...newProfileData, paymentWeek: 0, paymentInfo: '' });
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

  const PageNavigation = () => (
    <div className="mb-8">
      <div className="flex space-x-2 border-b border-gray-700">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
          { id: 'videos', label: 'Video Management', icon: ListIcon },
          { id: 'profiles', label: 'Profile Management', icon: UserGroupIcon },
          { id: 'payment', label: 'Payment Status', icon: DollarIcon },
          { id: 'docs', label: 'Docs', icon: DocumentIcon },
          { id: 'settings', label: 'Settings', icon: CogIcon },
          ...(appUser.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: ShieldCheckIcon }] : [])
        ].map(page => {
          const Icon = page.icon;
          return (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id as Page)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out -mb-px border-b-2
                ${
                  activePage === page.id
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              <Icon className="h-5 w-5" />
              <span>{page.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const DashboardPage = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardSummaryCard title="Total Profiles" value={profiles.length} />
        <DashboardSummaryCard title="Total Videos" value={videos.length} />
        <VideoUploadStats videos={videos} />
      </div>
      <StatsDashboard videos={videos} profiles={profiles} brands={brands} />
    </div>
  );
  
  const VideoManagementPage = () => (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Video
        </button>
      </div>
      <VideoDataTable 
        videos={videos} 
        onUpdateVideo={updateVideo} 
        brands={brands}
        appUser={appUser}
        onDeleteVideos={deleteVideos}
        onViewFile={handleViewFile}
      />
      <Modal isOpen={isModalOpen && activePage === 'videos'} onClose={() => setIsModalOpen(false)} title="Add New Video Record">
        <VideoForm onAddVideo={addVideo} profiles={profiles} brands={brands} />
      </Modal>
    </>
  );

  const ProfileManagementPage = () => (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Profile
        </button>
      </div>
      <ProfileDataTable 
        profiles={profiles} 
        videos={videos} 
        payments={payments}
        onUpdateProfile={updateProfile}
        onViewFile={handleViewFile}
        appUser={appUser}
        onDeleteProfiles={deleteProfiles}
      />
      <Modal isOpen={isModalOpen && activePage === 'profiles'} onClose={() => setIsModalOpen(false)} title="Register New Profile">
        <NewProfileForm onAddProfile={addProfile} />
      </Modal>
    </>
  );

  const PaymentStatusPage = () => (
      <PaymentStatusTable 
        profiles={profiles} 
        videos={videos} 
        payments={payments}
        onUpdateProfile={updateProfile} 
        onAddPayment={addPayment}
        brands={brands}
      />
  );

  const Docs = () => (
    <DocsPage 
      profiles={profiles} 
      payments={payments}
      onViewFile={handleViewFile}
    />
  );

  const Settings = () => (
    <SettingsPage 
      brands={brands} 
      onAddBrand={addBrand} 
      onRemoveBrand={removeBrand} 
    />
  );
  
  const Admin = () => (
    <AdminPage 
      users={allUsers}
      currentUser={appUser}
      onUpdateUserStatus={updateUserStatus}
    />
  );


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center justify-center space-x-3">
              <TikTokIcon className="h-10 w-10 text-cyan-400" />
              <h1 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
                TikTok Video Management Dashboard
              </h1>
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
            {activePage === 'dashboard' && <DashboardPage />}
            {activePage === 'videos' && <VideoManagementPage />}
            {activePage === 'profiles' && <ProfileManagementPage />}
            {activePage === 'payment' && <PaymentStatusPage />}
            {activePage === 'docs' && <Docs />}
            {activePage === 'settings' && <Settings />}
            {activePage === 'admin' && <Admin />}
        </main>

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