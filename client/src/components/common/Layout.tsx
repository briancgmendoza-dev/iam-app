import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="p-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 min-h-[calc(100vh-200px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
