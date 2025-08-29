import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';
import AdminDashboard from './dashboard/AdminDashboard';
import AffiliateDashboard from './dashboard/AffiliateDashboard';
import AffiliatesManagement from './admin/AffiliatesManagement';
import AnalyticsTabs from './analytics/AnalyticsTabs';

const MainApp = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) return null;

  const renderContent = () => {
    if (user.role === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setCurrentPage} />;
        case 'affiliates':
          return <AffiliatesManagement />;
        case 'sales':
          return <div className="p-6">Sales Management (Coming Soon)</div>;
        case 'commissions':
          return <div className="p-6">Commission Management (Coming Soon)</div>;
        case 'payouts':
          return <div className="p-6">Payout Management (Coming Soon)</div>;
        case 'analytics':
          return <AnalyticsTabs onNavigate={setCurrentPage} />;
        case 'tiers':
          return <div className="p-6">Tier Management (Coming Soon)</div>;
        case 'settings':
          return <div className="p-6">Settings (Coming Soon)</div>;
        default:
          return <AdminDashboard />;
      }
    } else if (user.role === 'affiliate') {
      switch (currentPage) {
        case 'dashboard':
          return <AffiliateDashboard />;
        case 'referrals':
          return <div className="p-6">My Referrals (Coming Soon)</div>;
        case 'links':
          return <div className="p-6">Referral Links (Coming Soon)</div>;
        case 'earnings':
          return <div className="p-6">Earnings Details (Coming Soon)</div>;
        case 'invites':
          return <div className="p-6">Email Invites (Coming Soon)</div>;
        case 'bonuses':
          return <div className="p-6">Bonuses & Rewards (Coming Soon)</div>;
        case 'profile':
          return <div className="p-6">Profile Settings (Coming Soon)</div>;
        default:
          return <AffiliateDashboard />;
      }
    } else {
      // Client dashboard
      return <div className="p-6">Client Dashboard (Coming Soon)</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainApp;