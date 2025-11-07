import React, { useState } from 'react';
import { Header } from './Header';
import { MainNav } from './MainNav';
import { VERSION, BUILD_DATE, RELEASE_NOTES } from '../../version';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Header />
      <MainNav />
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
      
      {/* Version Info - 좌측 하단 */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowReleaseNotes(!showReleaseNotes)}
          className="px-3 py-1.5 bg-gray-800/90 hover:bg-gray-700/90 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-300 transition-all backdrop-blur-sm"
        >
          v{VERSION}
        </button>
        
        {/* Release Notes Modal */}
        {showReleaseNotes && (
          <div className="absolute bottom-12 left-0 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">Release Notes</h3>
              <button
                onClick={() => setShowReleaseNotes(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(RELEASE_NOTES).map(([version, notes]) => (
                <div key={version} className="border-b border-gray-700 pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-cyan-400">v{version}</span>
                    {version === VERSION && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">Current</span>
                    )}
                  </div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {notes.map((note, idx) => (
                      <li key={idx} className="leading-relaxed">{note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
              Build Date: {BUILD_DATE}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
