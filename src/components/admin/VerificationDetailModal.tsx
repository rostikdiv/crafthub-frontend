import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XIcon,
    FileTextIcon,
    DownloadIcon,
    ShieldCheckIcon,
    ShieldAlertIcon,
    ExternalLinkIcon
} from
    'lucide-react';
import { Button } from '../ui/Button';
import { VerificationRequest } from './VerificationTable';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { fixImageUrl } from '../../lib/imageUtils';

type VerificationDetailModalProps = {
    request: VerificationRequest | null;
    onClose: () => void;
};

type VerificationDoc = {
    id: string;
    documentType: string;
    docUrl: string;
    status: string;
    createdAt: string;
};

export function VerificationDetailModal({
    request,
    onClose
}: VerificationDetailModalProps) {
    const { success, error: showError } = useToast();
    const [rejectReason, setRejectReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<VerificationDoc[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'word' | 'other'>('image');

    // Fetch document blob for preview
    useEffect(() => {
        const currentDoc = docs[selectedDocIndex];
        if (!currentDoc) {
            setPreviewUrl(null);
            return;
        }

        let activeUrl = '';
        const fetchPreview = async () => {
            try {
                const response = await api.get(`/documents/${currentDoc.id}`, {
                    responseType: 'blob'
                });
                const mimeType = (response.headers['content-type'] || response.data?.type || '').toLowerCase();
                const urlLower = (currentDoc.docUrl || '').toLowerCase();

                let detectedType: 'pdf' | 'image' | 'word' | 'other' = 'image';
                if (mimeType.includes('pdf') || urlLower.endsWith('.pdf')) {
                    detectedType = 'pdf';
                } else if (
                    mimeType.includes('word') ||
                    mimeType.includes('officedocument') ||
                    urlLower.endsWith('.docx') ||
                    urlLower.endsWith('.doc')
                ) {
                    detectedType = 'word';
                } else if (mimeType.includes('image') || urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png') || urlLower.endsWith('.webp')) {
                    detectedType = 'image';
                }

                setPreviewType(detectedType);
                activeUrl = URL.createObjectURL(response.data);
                setPreviewUrl(activeUrl);
            } catch (err) {
                setPreviewUrl(null);
            }
        };

        fetchPreview();

        return () => {
            if (activeUrl) URL.revokeObjectURL(activeUrl);
        };
    }, [docs, selectedDocIndex]);

    // Fetch documents when modal opens with a request
    useEffect(() => {
        if (request) {
            setLoadingDocs(true);
            setLoadingDetails(true);

            // Fetch Documents
            api.get<VerificationDoc[]>(`/admin/users/${request.userId}/documents`)
                .then(({ data }) => {
                    setDocs(data || []);
                    setSelectedDocIndex(0);
                })
                .catch(err => {
                    showError('Failed to load documents');
                })
                .finally(() => setLoadingDocs(false));

            // Fetch full user details to show military/seller profile info
            api.get(`/users/${request.userId}`)
                .then(({ data }) => setUserDetails(data))
                .catch(err => console.error('Failed to load user details', err))
                .finally(() => setLoadingDetails(false));

        } else {
            setDocs([]);
            setUserDetails(null);
        }
    }, [request]);

    const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
        if (!request) return;
        setLoading(true);
        try {
            await api.patch(`/admin/users/${request.userId}/verify`, null, {
                params: {
                    isVerified: status === 'APPROVED',
                    reason: rejectReason
                }
            });

            success(`Verification request ${status.toLowerCase()}.`);
            onClose();
            // Optional: reload or callback to refresh table
            window.location.reload();
        } catch (error) {
            showError(`Failed to ${status.toLowerCase()} request.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDocVerify = async (docId: string, isApproved: boolean) => {
        try {
            await api.patch(`/admin/docs/${docId}/verify`, null, {
                params: { isApproved }
            });

            success(isApproved ? 'Document approved' : 'Document rejected');

            // Update local state to reflect change immediately
            setDocs(prevDocs => prevDocs.map(d =>
                d.id === docId ? { ...d, status: isApproved ? 'APPROVED' : 'REJECTED' } : d
            ));
        } catch (e) {
            showError('Failed to update document status');
        }
    };

    const getDocTypeTitle = (type: string) => {
        switch (type) {
            case 'MILITARY_ID': return 'MILITARY ID';
            case 'REGISTRATION_CERT': return 'REGISTRATION CERT';
            case 'LICENSE': return 'LICENSE';
            case 'UNIT_ORDER': return 'UNIT ORDER';
            default: return 'PASSPORT / ID';
        }
    };

    if (!request) return null;

    const currentDoc = docs[selectedDocIndex];
    // Ensure we use fixImageUrl to handle localhost/minio conversion
    const fixedDocUrl = currentDoc ? fixImageUrl(currentDoc.docUrl) : '';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-6xl h-[85vh] rounded-sm shadow-2xl border-2 border-slate flex overflow-hidden z-10"
                >

                    {/* Left Panel: Document Preview */}
                    <div className="w-2/3 bg-gray-100 border-r border-border flex flex-col relative">
                        {/* Header: Doc Tabs */}
                        <div className="px-4 py-3 border-b border-border bg-white flex items-center gap-2 overflow-x-auto">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-2 flex-shrink-0">
                                Documents ({docs.length})
                            </span>
                            {loadingDocs && <span className="text-xs text-gray-400">Loading...</span>}
                            {!loadingDocs && docs.length === 0 && <span className="text-xs text-gray-400">No documents found.</span>}
                            {docs.map((doc, i) => {
                                let statusColors = '';
                                if (doc.status === 'APPROVED') {
                                    statusColors = selectedDocIndex === i ? 'bg-green-600 text-white border-green-600' : 'bg-green-100 text-green-800 border-green-300';
                                } else if (doc.status === 'REJECTED') {
                                    statusColors = selectedDocIndex === i ? 'bg-red-600 text-white border-red-600' : 'bg-red-100 text-red-800 border-red-300';
                                } else {
                                    statusColors = selectedDocIndex === i ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400';
                                }
                                return (
                                    <button
                                        key={doc.id}
                                        onClick={() => setSelectedDocIndex(i)}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase border rounded-sm whitespace-nowrap transition-colors ${statusColors}`}
                                    >
                                        {getDocTypeTitle(doc.documentType)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 bg-gray-200/50 flex items-center justify-center p-4 overflow-auto relative">
                            {currentDoc ? (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    {previewUrl ? (
                                        previewType === 'pdf' ? (
                                            <iframe
                                                src={previewUrl}
                                                className="w-full h-full min-h-[450px] border border-gray-300 shadow-sm bg-white rounded-sm"
                                                title="PDF Document Preview"
                                            />
                                        ) : previewType === 'word' ? (
                                            <div className="bg-white border border-gray-300 p-8 flex flex-col items-center justify-center gap-4 min-w-[320px] shadow-sm rounded-sm">
                                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                                    <FileTextIcon className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate text-sm uppercase">{getDocTypeTitle(currentDoc.documentType)}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Microsoft Word Document (.docx / .doc)</p>
                                                </div>
                                                <a
                                                    href={previewUrl}
                                                    download={`doc_${currentDoc.id}.docx`}
                                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm shadow-sm transition-colors"
                                                >
                                                    <DownloadIcon className="w-4 h-4" /> Download & Inspect Document
                                                </a>
                                            </div>
                                        ) : (
                                            <img
                                                src={previewUrl}
                                                alt="Document Preview"
                                                className="max-w-full max-h-full object-contain bg-white border border-gray-300 shadow-sm rounded-sm"
                                            />
                                        )
                                    ) : (
                                        <div className="bg-white border border-gray-300 p-12 flex flex-col items-center justify-center gap-4 min-w-[300px] min-h-[400px]">
                                            <FileTextIcon className="w-16 h-16 text-gray-300" />
                                            <p className="text-sm font-bold text-gray-500 uppercase">
                                                {currentDoc.documentType}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-400 font-medium flex flex-col items-center">
                                    <FileTextIcon className="w-12 h-12 mb-2 opacity-50" />
                                    <span>Select a document to preview</span>
                                </div>
                            )}
                        </div>


                        {/* Footer: Actions for current doc */}
                        {currentDoc && (
                            <div className="px-4 py-3 border-t border-border bg-white flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-slate">
                                        <span className="font-bold text-gray-500 uppercase mr-2">Status:</span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${currentDoc.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            currentDoc.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                            {currentDoc.status}
                                        </span>
                                    </div>
                                    <a
                                        href={`/view-document/${currentDoc.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-xs font-bold uppercase text-tactical hover:bg-green-50 px-3 py-1.5 rounded-sm transition-colors border border-transparent hover:border-green-200"
                                    >
                                        <ExternalLinkIcon className="w-4 h-4" />
                                        Open Document
                                    </a>
                                </div>

                                {/* Individual Doc Actions */}
                                <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                                    <Button
                                        size="xs"
                                        variant="danger"
                                        onClick={() => handleDocVerify(currentDoc.id, false)}
                                    >
                                        Reject Doc
                                    </Button>
                                    <Button
                                        size="xs"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleDocVerify(currentDoc.id, true)}
                                    >
                                        Approve Doc
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Applicant Details & Decision */}
                    <div className="w-1/3 flex flex-col bg-white overflow-y-auto">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white sticky top-0 z-10">
                            <h2 className="font-black text-lg uppercase tracking-tight text-slate">
                                Review Request
                            </h2>
                            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
                                <XIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-8">
                            {/* Applicant Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2">
                                    Applicant Information
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Full Name</label>
                                        <p className="font-bold text-slate text-base">{request.fullName}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Email Address</label>
                                        <p className="font-mono text-sm text-slate select-all bg-gray-50 p-1 rounded-sm border border-gray-100">{request.email}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400">User ID</label>
                                            <p className="font-mono text-[10px] text-gray-500 truncate" title={request.userId}>{request.userId}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Date Submitted</label>
                                            <p className="text-sm font-semibold text-slate">{new Date(request.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Request */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2">
                                    Requested Privileges
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-sm border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Role</span>
                                        <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase border ${request.role === 'MILITARY_UNIT' ? 'bg-green-100 text-green-800 border-green-200' :
                                            request.role === 'SELLER' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}>
                                            {request.role}
                                        </span>
                                    </div>
                                    {request.specificName !== 'N/A' && (
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Organization</span>
                                            <span className="text-sm font-bold text-slate">{request.specificName}</span>
                                        </div>
                                    )}

                                    {/* Detailed Profile Information */}
                                    {loadingDetails ? (
                                        <div className="text-xs text-gray-400 mt-2">Loading details...</div>
                                    ) : (
                                        <>
                                            {userDetails?.militaryProfile && userDetails.militaryProfile.unitNumber && (
                                                <div className="border-t border-gray-200 pt-3 mt-3 grid grid-cols-1 gap-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Unit Number</span>
                                                        <span className="text-xs font-bold text-slate">{userDetails.militaryProfile.unitNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">EDRPOU</span>
                                                        <span className="text-xs font-mono text-slate">{userDetails.militaryProfile.edrpou || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Commander Name</span>
                                                        <span className="text-xs font-bold text-slate">{userDetails.militaryProfile.commanderName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Official Address</span>
                                                        <span className="text-xs text-slate break-words">{userDetails.militaryProfile.officialAddress}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {userDetails?.sellerProfile && userDetails.sellerProfile.companyName && (
                                                <div className="border-t border-gray-200 pt-3 mt-3 grid grid-cols-1 gap-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Company Name</span>
                                                        <span className="text-xs font-bold text-slate">{userDetails.sellerProfile.companyName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Tax ID</span>
                                                        <span className="text-xs font-mono text-slate">{userDetails.sellerProfile.taxId || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Description</span>
                                                        <span className="text-xs text-slate break-words line-clamp-3" title={userDetails.sellerProfile.description}>{userDetails.sellerProfile.description || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Decision Form */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2">
                                    Admin Decision
                                </h3>

                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm text-xs text-amber-800 leading-relaxed">
                                    <ShieldAlertIcon className="w-4 h-4 inline mr-1 mb-0.5" />
                                    <strong>Caution:</strong> Approval grants immediate access.
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                                        Rejection Reason (Optional)
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-tactical resize-none"
                                        placeholder="Enter reason if rejecting..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-gray-50 space-y-3 sticky bottom-0 z-10">
                            <Button
                                fullWidth
                                onClick={() => handleAction('APPROVED')}
                                isLoading={loading}
                                className="flex items-center justify-center gap-2 shadow-md"
                            >
                                <ShieldCheckIcon className="w-4 h-4" />
                                APPROVE REQUEST
                            </Button>
                            <Button
                                fullWidth
                                variant="danger"
                                onClick={() => handleAction('REJECTED')}
                                isLoading={loading}
                                className="flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ShieldAlertIcon className="w-4 h-4" />
                                REJECT REQUEST
                            </Button>
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
