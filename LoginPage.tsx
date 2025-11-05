import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { TikTokIcon } from './components/icons/TikTokIcon';
import { GoogleIcon } from './components/icons/GoogleIcon';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not, create a new document
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // NOTE: The first admin user must be set manually in the Firestore console
        // by adding a `role: 'admin'` field to their user document.
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          status: 'pending', // Default status for new users
          role: 'user',      // Default role for new users
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Google Sign-In Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-8 md:p-12 space-y-8">
            <div className="text-center space-y-4">
                 <TikTokIcon className="h-16 w-16 text-cyan-400 mx-auto" />
                <h1 className="text-3xl font-bold text-white">
                    Management Dashboard
                </h1>
                <p className="text-gray-400">
                    Please sign in to continue.
                </p>
            </div>
          
            <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
            >
                <GoogleIcon className="h-6 w-6" />
                <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
            {error && <p className="text-red-400 text-sm text-center pt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;