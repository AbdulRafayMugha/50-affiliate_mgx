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
import CoordinatorAffiliates from './coordinator/CoordinatorAffiliates';
import CoordinatorDashboard from './coordinator/CoordinatorDashboard';
import AddAffiliate from './coordinator/AddAffiliate';
import CoordinatorManagement from './admin/CoordinatorManagement';
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
        case 'coordinators':
          return <CoordinatorManagement />;
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
    } else if (user.role === 'coordinator') {
      switch (currentPage) {
        case 'dashboard':
          return <CoordinatorDashboard />;
        case 'affiliates':
          return <CoordinatorAffiliates />;
        case 'add-affiliate':
          return <AddAffiliate />;
        case 'referrals':
          return <div className="p-6">Referrals (Coming Soon)</div>;
        case 'commissions':
          return <div className="p-6">Commissions (Coming Soon)</div>;
        case 'invites':
          return <div className="p-6">Email Referrals (Coming Soon)</div>;
        default:
          return (
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
                <p className="mt-2 text-gray-600">Welcome, {user.name}!</p>
              </div>
            </div>
          );
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