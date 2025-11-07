import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './Header';
import { MainNav } from './MainNav';
import { VERSION } from '../../version';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Header />
      <MainNav />
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #4b5563',
            borderRadius: '0.5rem',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      {/* Version Info - 좌측 하단 (모달 없이 표시만) */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="px-3 py-1.5 bg-gray-800/90 border border-gray-700 rounded-lg text-xs text-gray-400 backdrop-blur-sm">
          v{VERSION}
        </div>
      </div>
    </div>
  );
};
