import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react';
import { VerificationTable, VerificationRequest } from '../components/admin/VerificationTable';
import { VerificationDetailModal } from '../components/admin/VerificationDetailModal';
import { DeliveryManagement } from '../components/admin/DeliveryManagement';

type AdminTab = 'verification' | 'delivery';

export function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('verification');
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="page-wrapper"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs mb-8">
                    <Link to="/" className="text-gray-500 hover:text-slate transition-colors">{t('catalog.home')}</Link>
                    <ChevronRightIcon className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-slate">{t('adminDashboard.title')}</span>
                </nav>

                {/* Page Header */}
                <div className="border-b-2 border-tactical pb-4 mb-8">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate">
                        {activeTab === 'verification' ? t('adminDashboard.verificationQueue') : t('adminDashboard.deliveryLogistics')}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {activeTab === 'verification'
                            ? t('adminDashboard.verifyDesc')
                            : t('adminDashboard.deliveryDesc')}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'verification'
                                ? 'border-tactical text-tactical'
                                : 'border-transparent text-gray-500 hover:text-slate hover:border-gray-300'
                            }`}
                    >
                        <ShieldCheckIcon className="w-4 h-4" /> {t('adminDashboard.tabVerification')}
                    </button>
                    <button
                        onClick={() => setActiveTab('delivery')}
                        className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'delivery'
                                ? 'border-tactical text-tactical'
                                : 'border-transparent text-gray-500 hover:text-slate hover:border-gray-300'
                            }`}
                    >
                        <TruckIcon className="w-4 h-4" /> {t('adminDashboard.tabDelivery')}
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'verification' ? (
                            <>
                                {/* Stats from original page could go here or be shared */}
                                <VerificationTable onSelect={setSelectedRequest} />
                                <VerificationDetailModal
                                    request={selectedRequest}
                                    onClose={() => setSelectedRequest(null)}
                                />
                            </>
                        ) : (
                            <DeliveryManagement />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
