import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import {
  DashboardSidebar,
  DashboardTab
} from
  '../components/dashboard/DashboardSidebar';
import { OrdersView } from '../components/dashboard/OrdersView';
import { ReviewsView } from '../components/dashboard/ReviewsView';
import { VerificationView } from '../components/dashboard/VerificationView';
import { AddressBookView } from '../components/dashboard/AddressBookView';
import { ProfileView } from '../components/dashboard/ProfileView';
import { useAuth } from '../lib/authContext';

export function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isVerificationApplicable = (user?.role === 'SELLER' || user?.role === 'MILITARY_UNIT' || !!user?.sellerProfile || !!user?.militaryProfile) && user?.role !== 'ADMIN';
  
  const initialTab = (location.state as { tab?: DashboardTab })?.tab;
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    (initialTab === 'verification' && !isVerificationApplicable) ? 'orders' : (initialTab || 'orders')
  );

  // Update active tab if location state changes (for navigation from navbar)
  React.useEffect(() => {
    if (location.state && (location.state as any).tab) {
      const targetTab = (location.state as any).tab;
      if (targetTab === 'verification' && !isVerificationApplicable) {
        setActiveTab('orders');
      } else {
        setActiveTab(targetTab);
      }
    }
  }, [location.state, isVerificationApplicable]);

  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0
      }}
      transition={{
        duration: 0.3
      }}
      className="page-wrapper">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-8">
          <Link
            to="/"
            className="text-gray-500 hover:text-slate transition-colors">

            HOME
          </Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-slate">OPERATOR DASHBOARD</span>
        </nav>

        {/* Page Header */}
        <div className="border-t-2 border-tactical pt-4 mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate">
            OPERATOR DASHBOARD
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your requisitions, clearance status, and field reports.
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: -20
                }}
                transition={{
                  duration: 0.2
                }}>

                {activeTab === 'orders' && <OrdersView />}
                {activeTab === 'reviews' && <ReviewsView />}
                {activeTab === 'profile' && <ProfileView />}
                {activeTab === 'verification' && <VerificationView onNavigateTab={setActiveTab} />}
                {activeTab === 'addresses' && <AddressBookView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </motion.div>);

}