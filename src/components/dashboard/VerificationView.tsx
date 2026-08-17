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
    const [needsMilitaryProfile, setNeedsMilitaryProfile] = useState(false);
    const [milData, setMilData] = useState({
        unitNumber: user?.militaryProfile?.unitNumber || '',
        edrpou: user?.militaryProfile?.edrpou || '',
        commanderName: user?.militaryProfile?.commanderName || '',
        officialAddress: user?.militaryProfile?.officialAddress || ''
    });
    const [milSaving, setMilSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        const missingMil = (user.role === 'MILITARY_UNIT' || !!user.militaryProfile) && !user.militaryProfile;
        setNeedsMilitaryProfile(missingMil);
    }, [user]);

    const handleSaveMilitaryProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMilSaving(true);
        try {
            await api.post('/military/profile', milData);
            success('Military unit profile details saved successfully!');
            setNeedsMilitaryProfile(false);
            window.location.reload();
        } catch (err: any) {
            console.error('Failed to save military profile', err);
            showError(err.response?.data?.message || 'Failed to save unit profile details.');
        } finally {
            setMilSaving(false);
        }
    };

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

    const isMilitary = user?.role === 'MILITARY_UNIT' || !!user?.militaryProfile;

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
                            {isMilitary ? 'Verify your Military Unit clearance to access restricted tactical gear.' :
                                user?.role === 'SELLER' ? 'Verify your Seller account credentials.' : 'Account Verification'}
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

            {/* Inline Military Unit Profile Completion if needed */}
            {needsMilitaryProfile && (
                <div className="bg-amber-50 p-6 rounded-sm border border-amber-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate uppercase tracking-tight">Step 1: Military Unit Details</h3>
                            <p className="text-xs text-amber-800">Please provide unit credentials before or along with submitting your documents.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveMilitaryProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Military Unit Number"
                                placeholder="e.g. A1234"
                                value={milData.unitNumber}
                                onChange={(e: any) => setMilData({ ...milData, unitNumber: e.target.value })}
                                required
                            />
                            <Input
                                label="EDRPOU Code"
                                placeholder="e.g. 12345678"
                                value={milData.edrpou}
                                onChange={(e: any) => setMilData({ ...milData, edrpou: e.target.value })}
                            />
                            <Input
                                label="Commander Name / Rank"
                                placeholder="e.g. Col. Ivan Shevchenko"
                                value={milData.commanderName}
                                onChange={(e: any) => setMilData({ ...milData, commanderName: e.target.value })}
                                required
                            />
                            <Input
                                label="Official Unit Address"
                                placeholder="e.g. Kyiv, Base #12"
                                value={milData.officialAddress}
                                onChange={(e: any) => setMilData({ ...milData, officialAddress: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" isLoading={milSaving} disabled={milSaving} className="bg-amber-600 hover:bg-amber-700 text-white">
                                Save Unit Details
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Upload Section */}
            {!user?.isVerified && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Passport / ID */}
                    <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                        <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate">Personal ID / Passport</h3>
                            <p className="text-xs text-gray-500 mt-1">Required for identity confirmation</p>
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
                                {uploading ? 'Uploading...' : 'Upload Passport / ID'}
                            </Button>
                        </div>
                    </div>

                    {/* Military ID - For Military Units and users with military profile */}
                    {isMilitary && (
                        <div className="bg-white p-6 rounded-sm border border-border flex flex-col items-center text-center gap-4 hover:border-tactical/50 transition-colors">
                            <div className="w-12 h-12 bg-slate/5 rounded-full flex items-center justify-center">
                                <Shield className="w-6 h-6 text-slate" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate">Military ID / Order</h3>
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
                                    {uploading ? 'Uploading...' : 'Upload Military ID'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
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
