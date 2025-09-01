import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';
import AdminDashboard from './dashboard/AdminDashboard';
import AffiliateDashboard from './dashboard/AffiliateDashboard';
import MyReferrals from './dashboard/MyReferrals';
import BonusesRewards from './dashboard/BonusesRewards';
import EmailInvites from './dashboard/EmailInvites';
import AffiliatesManagement from './admin/AffiliatesManagement';
import CommissionManagement from './admin/CommissionManagement';
import AnalyticsTabs from './analytics/AnalyticsTabs';
import { CommissionProvider } from '../contexts/CommissionContext';

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
        case 'commissions':
          return <CommissionManagement />;
        case 'analytics':
          return <AnalyticsTabs onNavigate={setCurrentPage} />;
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
          return <MyReferrals />;
        case 'invites':
          return <EmailInvites />;
        case 'bonuses':
          return <BonusesRewards />;
        default:
          return <AffiliateDashboard />;
      }
    } else {
      // Client dashboard
      return <div className="p-6">Client Dashboard (Coming Soon)</div>;
    }
  };

  return (
    <CommissionProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
          <main className="flex-1 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </CommissionProvider>
  );
};

export default MainApp;