import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import App from './App';
import LoginPage from './LoginPage';
import FullScreenMessage from './components/FullScreenMessage';
import { AppUser } from './types';

const Auth: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Check user status in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setAppUser(userDocSnap.data() as AppUser);
        } else {
          // This case might happen if document creation failed after signup.
          // For simplicity, we treat them as not having access.
          setAppUser(null); 
        }
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <FullScreenMessage title="Loading..." message="Authenticating your session, please wait." />;
  }

  if (!user) {
    return <LoginPage />;
  }
  
  // This check handles both the case where appUser hasn't loaded yet,
  // or the user document doesn't exist in Firestore.
  if (!appUser) {
    return <FullScreenMessage title="Access Error" message="Your account is not registered in the system. Please sign up or contact an administrator if you believe this is an error." onSignOut={handleSignOut} userEmail={user.email} />;
  }

  if (appUser.status === 'pending') {
    return <FullScreenMessage title="Approval Pending" message="Your account is waiting for administrator approval." onSignOut={handleSignOut} userEmail={user.email} />;
  }

  if (appUser.status === 'rejected') {
     return <FullScreenMessage title="Access Denied" message="Your account has been rejected. Please contact an administrator." onSignOut={handleSignOut} userEmail={user.email} />;
  }
  
  if (appUser.status === 'approved') {
    return <App user={user} appUser={appUser} onSignOut={handleSignOut} />;
  }

  // Fallback for any other unknown status
  return <FullScreenMessage title="Unknown Status" message={`Your account has an unrecognized status. Please contact an administrator. Status: ${appUser.status}`} onSignOut={handleSignOut} userEmail={user.email} />;
};

export default Auth;