import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckIcon, FileTextIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { AxiosError } from 'axios';

type MilitaryProfileData = {
    unitNumber: string;
    edrpou: string;
    commanderName: string;
    officialAddress: string;
};

export function MilitaryDashboardPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [profileData, setProfileData] = useState<MilitaryProfileData>({
        unitNumber: '',
        edrpou: '',
        commanderName: '',
        officialAddress: ''
    });
    const [docUrl, setDocUrl] = useState('');
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch initial profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/military/profile');
                if (data.militaryProfile) {
                    setProfileData({
                        unitNumber: data.militaryProfile.unitNumber || '',
                        edrpou: data.militaryProfile.edrpou || '',
                        commanderName: data.militaryProfile.commanderName || '',
                        officialAddress: data.militaryProfile.officialAddress || ''
                    });
                }
            } catch (error) {
                console.error("Failed to load military profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileChange = (field: keyof MilitaryProfileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const submitProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingProfile(true);
        setSuccessMessage('');
        try {
            await api.post('/military/profile', profileData);
            setSuccessMessage(t('militaryDashboard.profileSuccess'));
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message: string }>;
            alert(axiosError.response?.data?.message || t('militaryDashboard.profileFailed'));
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    const submitDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docUrl.trim()) return;
        setIsSubmittingDoc(true);
        setSuccessMessage('');
        try {
            await api.post('/military/documents', {
                documentType: 'MILITARY_ID',
                docUrl: docUrl
            });
            setSuccessMessage(t('militaryDashboard.docSuccess'));
            setDocUrl('');
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message: string }>;
            alert(axiosError.response?.data?.message || t('militaryDashboard.docFailed'));
        } finally {
            setIsSubmittingDoc(false);
        }
    };

    if (user?.role !== 'MILITARY_UNIT') {
        return (
            <div className="page-wrapper flex items-center justify-center">
                <div className="text-center p-8 bg-white border border-border rounded-sm max-w-md mx-auto">
                    <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-bold text-slate mb-2">{t('militaryDashboard.accessDenied')}</h2>
                    <p className="text-gray-500">{t('militaryDashboard.restrictedToMilitary')}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="page-wrapper"
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 border-b-2 border-tactical pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-slate">{t('militaryDashboard.title')}</h1>
                        <p className="text-sm text-gray-600 mt-2">{t('militaryDashboard.subtitle')}</p>
                    </div>
                    {user.isVerified && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 border border-green-200 rounded-sm">
                            <CheckIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{t('militaryDashboard.verified')}</span>
                        </div>
                    )}
                </div>

                {successMessage && (
                    <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-sm flex items-center gap-3">
                        <CheckIcon className="w-5 h-5" />
                        <p className="text-sm font-semibold">{successMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Profile Details Form */}
                    <div className="bg-white border border-border rounded-sm">
                        <div className="px-6 py-4 border-b border-border bg-cream/50">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-tactical">{t('militaryDashboard.unitProfileTitle')}</h2>
                        </div>
                        <form onSubmit={submitProfile} className="p-6 space-y-4">
                            <Input
                                label={t('militaryDashboard.unitNumber')}
                                placeholder={t('militaryDashboard.unitNumberPlaceholder')}
                                value={profileData.unitNumber}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProfileChange('unitNumber', e.target.value)}
                                required
                            />
                            <Input
                                label={t('militaryDashboard.edrpou')}
                                placeholder={t('militaryDashboard.edrpouPlaceholder')}
                                value={profileData.edrpou}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProfileChange('edrpou', e.target.value)}
                                required
                            />
                            <Input
                                label={t('militaryDashboard.commanderName')}
                                placeholder={t('militaryDashboard.commanderPlaceholder')}
                                value={profileData.commanderName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProfileChange('commanderName', e.target.value)}
                                required
                            />
                            <Input
                                label={t('militaryDashboard.officialAddress')}
                                placeholder={t('militaryDashboard.addressPlaceholder')}
                                value={profileData.officialAddress}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProfileChange('officialAddress', e.target.value)}
                                required
                            />
                            <Button type="submit" fullWidth disabled={isSubmittingProfile} className="mt-4">
                                {isSubmittingProfile ? t('militaryDashboard.saving') : t('militaryDashboard.saveProfile')}
                            </Button>
                        </form>
                    </div>

                    {/* Document Upload Form */}
                    <div className="bg-white border border-border rounded-sm self-start">
                        <div className="px-6 py-4 border-b border-border bg-cream/50">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-tactical">{t('militaryDashboard.verificationDocsTitle')}</h2>
                        </div>
                        <form onSubmit={submitDocument} className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    {t('militaryDashboard.docInstruction')}
                                </p>
                                <div className="p-4 border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 mb-6 rounded-sm">
                                    <FileTextIcon className="w-8 h-8 text-gray-400" />
                                    <p className="text-xs font-mono text-gray-500">{t('militaryDashboard.docFormatMsg')}</p>
                                </div>
                                <Input
                                    label={t('militaryDashboard.docUrl')}
                                    placeholder={t('militaryDashboard.docUrlPlaceholder')}
                                    value={docUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocUrl(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" variant="secondary" fullWidth disabled={isSubmittingDoc || !docUrl.trim()}>
                                {isSubmittingDoc ? t('militaryDashboard.submitting') : t('militaryDashboard.submitDoc')}
                            </Button>
                        </form>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
