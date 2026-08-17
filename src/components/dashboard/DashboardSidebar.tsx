import React from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  PackageIcon,
  StarIcon,
  ShieldIcon,
  MapPinIcon,
  LogOutIcon
} from
  'lucide-react';
import { useAuth } from '../../lib/authContext';

export type DashboardTab =
  'profile' |
  'orders' |
  'reviews' |
  'verification' |
  'addresses';
type DashboardSidebarProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};
const menuItems: {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
}[] = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: UserIcon
    },
    {
      id: 'orders',
      label: 'Order History',
      icon: PackageIcon
    },
    {
      id: 'reviews',
      label: 'My Reviews',
      icon: StarIcon
    },
    {
      id: 'verification',
      label: 'Clearance Status',
      icon: ShieldIcon
    },
    {
      id: 'addresses',
      label: 'Saved Locations',
      icon: MapPinIcon
    }];

export function DashboardSidebar({
  activeTab,
  onTabChange
}: DashboardSidebarProps) {
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user) return '??';
    const f = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const l = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return f + l || '?';
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-white border border-border rounded-sm h-fit">
      {/* User Info Header */}
      <div className="p-6 border-b border-border bg-cream/50 text-center">
        <div className="w-16 h-16 bg-slate rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
          {getInitials()}
        </div>
        <h3 className="font-bold text-slate uppercase tracking-tight">
          {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
        </h3>
        <p className="text-xs text-gray-500 font-mono mt-1">
          OP-ID: {user ? user.id.substring(0, 8).toUpperCase() : '...'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems
            .filter((item) => {
              if (item.id === 'verification') {
                return (user?.role === 'SELLER' || user?.role === 'MILITARY_UNIT' || !!user?.sellerProfile || !!user?.militaryProfile) && user?.role !== 'ADMIN';
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors rounded-sm
                      ${isActive ? 'bg-tactical text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-slate'}
                    `}>

                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </li>);

            })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-border mt-2">
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-restricted hover:bg-red-50 transition-colors rounded-sm">
          <LogOutIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>);

}