import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign,
  Mail, 
  Settings, 
  BarChart3,
  UserCheck,
  Gift,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user } = useAuth();

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'affiliates', label: 'Affiliates', icon: Users },
    { id: 'commissions', label: 'Commissions', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const affiliateMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'referrals', label: 'My Referrals', icon: Users },
    { id: 'invites', label: 'Email Invites', icon: Mail },
    { id: 'bonuses', label: 'Bonuses & Rewards', icon: Gift },
  ];

  const clientMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'My Purchases', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin': return adminMenuItems;
      case 'affiliate': return affiliateMenuItems;
      case 'client': return clientMenuItems;
      default: return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full">
      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                currentPage === item.id && "bg-blue-600 text-white hover:bg-blue-700"
              )}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;