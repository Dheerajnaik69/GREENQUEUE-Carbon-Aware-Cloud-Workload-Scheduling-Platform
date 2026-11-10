import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ToastContainer } from '../common/ToastContainer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#080D12] text-[#E8F1EE]">
      {/* Permanent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

