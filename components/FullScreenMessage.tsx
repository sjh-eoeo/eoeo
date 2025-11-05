import React from 'react';
import { TikTokIcon } from './icons/TikTokIcon';

interface FullScreenMessageProps {
  title: string;
  message: string;
  userEmail?: string | null;
  onSignOut?: () => void;
}

const FullScreenMessage: React.FC<FullScreenMessageProps> = ({ title, message, userEmail, onSignOut }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <TikTokIcon className="h-16 w-16 text-cyan-400 mx-auto" />
        <h1 className="text-4xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-lg">{message}</p>
        {onSignOut && (
          <div className="pt-4">
            {userEmail && <p className="text-sm text-gray-500 mb-2">Logged in as {userEmail}</p>}
            <button
              onClick={onSignOut}
              className="bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenMessage;
