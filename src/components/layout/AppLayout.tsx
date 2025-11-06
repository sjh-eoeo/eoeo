import React from 'react';
import { Header } from './Header';
import { MainNav } from './MainNav';

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
    </div>
  );
};
