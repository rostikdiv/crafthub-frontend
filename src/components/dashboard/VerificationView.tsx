import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, FileText, CheckCircle, XCircle, Clock, Trash, Building2, UserCircle, ArrowRight, Info, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { useTranslation } from 'react-i18next';
import { DashboardTab } from './DashboardSidebar';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type DocumentType = 'PASSPORT' | 'MILITARY_ID' | 'REGISTRATION_CERT' | 'LICENSE' | 'UNIT_ORDER';

type VerificationDoc = {
    id: string;
    documentType: DocumentType;
    docUrl: string;
    status: VerificationStatus;
    createdAt: string;
};

interface VerificationViewProps {
    onNavigateTab?: (tab: DashboardTab) => void;
}

export function VerificationView({ onNavigateTab }: VerificationViewProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [docs, setDocs] = useState<VerificationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMilitary = user?.role === 'MILITARY_UNIT' || !!user?.militaryProfile;
    const isSeller = user?.role === 'SELLER' || !!user?.sellerProfile;

    const hasProfile = isMilitary
        ? !!user?.militaryProfile
        : isSeller
            ? !!user?.sellerProfile
            : true;

    const fetchDocs = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<VerificationDoc[]>('/users/me/verification-docs');
            setDocs(data || []);
        } catch (err) {
            console.error('Failed to fetch docs', err);
            setError('Failed to load verification documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload File
            const { data: uploadData } = await api.post<{ url: string }>('/users/uploads/document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Create Doc Record
            await api.post('/users/me/verification-docs', {
                documentType: type,
                docUrl: uploadData.url
            });

            success('Document uploaded successfully for review!');
            fetchDocs(); // Refresh list
        } catch (err: any) {
            console.error('Upload failed', err);
            showError(err.response?.data?.message || 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.delete(`/users/me/verification-docs/${id}`);
            success('Document deleted.');
            setDocs(docs.filter(d => d.id !== id));
        } catch (err) {
            console.error('Delete failed', err);
            showError('Failed to delete document.');
        }
    };

    const getStatusColor = (status: VerificationStatus) => {
        switch (status) {
            case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-amber-600 bg-amber-50 border-amber-200';
        }
    };

    const getStatusIcon = (status: VerificationStatus) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-3 h-3" />;
            case 'REJECTED': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    const getDocTypeName = (type: DocumentType) => {
        switch (type) {
            case 'MILITARY_ID': return 'Military ID / Officer Certificate';
            case 'REGISTRATION_CERT': return 'Company Registration / Tax Extract';
            case 'LICENSE': return 'Special License / Permit';
            case 'UNIT_ORDER': return 'Commander Order';
            default: return 'Personal ID / Passport';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading verification status...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error} <Button variant="link" onClick={fetchDocs}>Retry</Button></div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {/* Header Status */}
            <div className="bg-white p-6 rounded-sm border border-border shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate uppercase tracking-tight flex items-center gap-2">
                            <Shield className="w-5 h-5 text-tactical" />
                            {t('verification.title')}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {t('verification.subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDocs}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider h-8"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-tactical' : ''}`} />
                            {t('common.refresh', 'Refresh')}
                        </Button>
                        <div className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 ${user?.isVerified ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'
                            }`}>
                            {user?.isVerified ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    {t('verification.statusApproved')}
                                </>
                            ) : (
                                <>
                                    <Clock className="w-4 h-4" />
                                    {user?.isVerified === false ? t('auth.unverified').toUpperCase() : t('verification.statusPending')}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Re-login Reminder Notice Banner - High Visibility Orange */}
            <div className="bg-orange-500/10 border-2 border-orange-500 p-5 rounded-sm shadow-md text-slate">
                <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-orange-500 text-white rounded-sm shadow-sm shrink-0 mt-0.5">
                        <Info className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-2">
                            {t('verification.reloginNoticeTitle')}
                        </h4>
                        <p className="text-xs font-semibold text-gray-800 mt-1 leading-relaxed">
                            {t('verification.reloginNoticeDesc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 1 Requirement Prompt: Profile Must Be Created First */}
            {!hasProfile ? (
                <div className="bg-amber-50 p-8 rounded-sm border border-amber-200 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        {isMilitary ? (
                            <Shield className="w-7 h-7 text-amber-700" />
                        ) : (
                            <Building2 className="w-7 h-7 text-amber-700" />
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-slate uppercase tracking-tight mb-2">
                        {isMilitary ? 'Military Unit Profile Required First' : 'Shop Profile Required First'}
                    </h3>
                    <p className="text-sm text-gray-600 max-w-lg mb-6 leading-relaxed">
                        {isMilitary
                            ? 'Before submitting verification documents, please fill in your Military Unit details (Unit Number, EDRPOU, Commander, and Base Address) in your profile.'
                            : 'Before submitting business documents, please set up your Seller Shop profile (Company Name, Tax ID, and store details).'}
                    </p>
                    {isMilitary ? (
                        <Button
                            onClick={() => {
                                if (onNavigateTab) {
                                    onNavigateTab('profile');
                                } else {
                                    window.location.href = '/dashboard';
                                }
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 font-bold uppercase tracking-wider text-xs px-6 py-3"
                        >
                            Complete Military Unit Profile
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => window.location.href = '/seller'}
                            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 font-bold uppercase tracking-wider text-xs px-6 py-3"
                        >
                            Go to Shop Studio Settings
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ) : (
                /* Step 2: Document Upload Section (Tailored by Role) */
                !user?.isVerified && (
                    <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate">
                                Step 2: Submit Verification Documents
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Upload required documents for administrator verification. Accepted formats: PDF, DOCX, DOC, JPG, PNG (up to 10MB).
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Military Specific Documents */}
                            {isMilitary && (
                                <>
                                    {/* 1. Military ID / Order */}
                                    <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                                        <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-tactical" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate">Military ID / Service Order</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Officer certificate, military ID, or official unit order (PDF, DOCX, JPG, PNG)
                                            </p>
                                        </div>
                                        <div className="w-full">
                                            <input
                                                type="file"
                                                id="upload-military"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                onChange={(e) => handleFileUpload(e, 'MILITARY_ID')}
                                                disabled={uploading}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById('upload-military')?.click()}
                                                disabled={uploading}
                                                className="w-full flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Upload Military ID / Order'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 2. Personal ID / Passport */}
                                    <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                                        <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-slate" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate">Authorized Officer Passport / ID</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Identity confirmation of the commanding officer or authorized representative
                                            </p>
                                        </div>
                                        <div className="w-full">
                                            <input
                                                type="file"
                                                id="upload-passport"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                onChange={(e) => handleFileUpload(e, 'PASSPORT')}
                                                disabled={uploading}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById('upload-passport')?.click()}
                                                disabled={uploading}
                                                className="w-full flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Upload Officer Passport / ID'}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Seller Specific Documents */}
                            {isSeller && !isMilitary && (
                                <>
                                    {/* 1. Registration / Tax Certificate */}
                                    <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                                        <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-tactical" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate">State Registration / Tax Extract</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Extract from State Register (ЄДР / ФОП / ТОВ) matching Tax ID: {user?.sellerProfile?.taxId || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="w-full">
                                            <input
                                                type="file"
                                                id="upload-reg-cert"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                onChange={(e) => handleFileUpload(e, 'REGISTRATION_CERT')}
                                                disabled={uploading}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById('upload-reg-cert')?.click()}
                                                disabled={uploading}
                                                className="w-full flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Upload Registration Certificate'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 2. Owner Passport / ID */}
                                    <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                                        <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-slate" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate">Owner / Director Passport</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Passport or ID card of the registered business owner or director
                                            </p>
                                        </div>
                                        <div className="w-full">
                                            <input
                                                type="file"
                                                id="upload-seller-passport"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                onChange={(e) => handleFileUpload(e, 'PASSPORT')}
                                                disabled={uploading}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById('upload-seller-passport')?.click()}
                                                disabled={uploading}
                                                className="w-full flex items-center justify-center gap-2"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Upload Owner Passport / ID'}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Documents List */}
            <div className="bg-white rounded-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-slate/5">
                    <h3 className="font-bold text-slate text-sm uppercase tracking-wider">Submitted Documents</h3>
                </div>

                <div className="divide-y divide-border">
                    {docs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm italic">
                            No documents submitted yet.
                        </div>
                    ) : (
                        docs.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate text-sm">
                                            {getDocTypeName(doc.documentType)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                        <a
                                            href={`/view-document/${doc.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-tactical hover:underline"
                                        >
                                            View Document
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase border flex items-center gap-1.5 ${getStatusColor(doc.status)}`}>
                                        {getStatusIcon(doc.status)}
                                        {doc.status}
                                    </span>
                                    {doc.status !== 'APPROVED' && (
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Delete Document"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
