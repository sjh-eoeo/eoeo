import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';
import { auth, db } from './lib/firebase/config';
import { useAuthStore } from './store/useAuthStore';
import App from './App';
import LoginPage from '../LoginPage';
import FullScreenMessage from '../components/FullScreenMessage';
import type { AppUser } from './types';

const Auth: React.FC = () => {
  const { user, appUser, loading, setUser, setAppUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Check user status in Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setAppUser(userDocSnap.data() as AppUser);
          } else {
            // Create new user document with pending status
            const newUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'user',
              status: 'pending',
            };
            
            await setDoc(userDocRef, newUser);
            console.log('✅ New user document created:', newUser.email);
            setAppUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching/creating user document:', error);
          setAppUser(null);
        }
      } else {
        setUser(null);
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAppUser, setLoading]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <FullScreenMessage
        title="Loading..."
        message="Authenticating your session, please wait."
      />
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!appUser) {
    return (
      <FullScreenMessage
        title="Access Error"
        message="Your account is not registered in the system. Please sign up or contact an administrator."
        onSignOut={handleSignOut}
        userEmail={user.email}
      />
    );
  }

  if (appUser.status === 'pending') {
    return (
      <FullScreenMessage
        title="Approval Pending"
        message="Your account is waiting for administrator approval. Please contact sjh@egongegong.com via Slack or email to expedite the process."
        onSignOut={handleSignOut}
        userEmail={user.email}
      />
    );
  }

  if (appUser.status === 'rejected') {
    return (
      <FullScreenMessage
        title="Access Denied"
        message="Your account has been rejected. Please contact an administrator."
        onSignOut={handleSignOut}
        userEmail={user.email}
      />
    );
  }

  if (appUser.status === 'approved') {
    return (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }

  return (
    <FullScreenMessage
      title="Unknown Status"
      message={`Your account has an unrecognized status. Status: ${appUser.status}`}
      onSignOut={handleSignOut}
      userEmail={user.email}
    />
  );
};

export default Auth;
