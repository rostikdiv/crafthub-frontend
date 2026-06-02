import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, FileText, CheckCircle, XCircle, Clock, Trash, Building2, UserCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { fixImageUrl } from '../../lib/imageUtils';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type VerificationDoc = {
    id: string;
    documentType: 'PASSPORT' | 'MILITARY_ID';
    docUrl: string;
    status: VerificationStatus;
    createdAt: string;
};

export function VerificationView() {
    const { user, login } = useAuth(); // Need to refresh user potentially, using login is hacky, maybe just api.get
    const { success, error: showError } = useToast();
    const [docs, setDocs] = useState<VerificationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Profile Form State
    const [needsProfile, setNeedsProfile] = useState(false);

    useEffect(() => {
        if (!user) return;
        const missing = (user.role === 'MILITARY_UNIT' && !user.militaryProfile) ||
            (user.role === 'SELLER' && !user.sellerProfile);
        setNeedsProfile(!!missing);
    }, [user]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PASSPORT' | 'MILITARY_ID') => {
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

            success('Document uploaded successfully!');
            fetchDocs(); // Refresh list
        } catch (err) {
            console.error('Upload failed', err);
            showError('Failed to upload document.');
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
                            Identity Verification
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {user?.role === 'MILITARY_UNIT' ? 'Verify your Unit status.' :
                                user?.role === 'SELLER' ? 'Verify your Seller account.' : 'Account Verification'}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 ${user?.isVerified ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'
                        }`}>
                        {user?.isVerified ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                VERIFIED
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4" />
                                {user?.isVerified === false ? 'UNVERIFIED' : 'PENDING'}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Required Prompt */}
            {needsProfile ? (
                <div className="bg-amber-50 p-6 rounded-sm border border-amber-200 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <UserCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate mb-2">Complete Your Profile</h3>
                    <p className="text-sm text-gray-600 max-w-md mb-6">
                        Before you can upload verification documents, we need a few more details about your
                        {user?.role === 'MILITARY_UNIT' ? ' Military Unit' : ' Shop'}.
                    </p>
                    <Button
                        onClick={() => window.location.href = user?.role === 'SELLER' ? '/seller' : '/dashboard'}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Go to {user?.role === 'SELLER' ? 'My Shop Settings' : 'Profile Settings'}
                    </Button>
                </div>
            ) : (
                /* Upload Section */
                !user?.isVerified && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Passport / ID */}
                        <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                            <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-slate" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate">Personal ID / Passport</h3>
                                <p className="text-xs text-gray-500 mt-1">Required for all verifications</p>
                            </div>
                            <div className="w-full">
                                <input
                                    type="file"
                                    id="upload-passport"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
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
                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                </Button>
                            </div>
                        </div>

                        {/* Military ID - Only for Military */}
                        {user?.role === 'MILITARY_UNIT' && (
                            <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                                <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-slate" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate">Military ID</h3>
                                    <p className="text-xs text-gray-500 mt-1">Required for Military Units status</p>
                                </div>
                                <div className="w-full">
                                    <input
                                        type="file"
                                        id="upload-military"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
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
                                        {uploading ? 'Uploading...' : 'Upload Document'}
                                    </Button>
                                </div>
                            </div>
                        )}
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
                                            {doc.documentType === 'MILITARY_ID' ? 'Military ID' : 'Personal ID / Passport'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                        {/* Added view link here as well for consistency */}
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
