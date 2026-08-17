import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader, FileText, Download, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function ViewDocument() {
    const { id } = useParams<{ id: string }>();
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'pdf' | 'image' | 'word' | 'other'>('image');
    const [fileName, setFileName] = useState<string>('document');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let activeUrl = '';
        const fetchDocument = async () => {
            try {
                const response = await api.get(`/documents/${id}`, {
                    responseType: 'blob'
                });

                const mimeType = (response.headers['content-type'] || response.data?.type || '').toLowerCase();
                const contentDisp = response.headers['content-disposition'] || '';
                let detectedName = 'document';
                if (contentDisp.includes('filename=')) {
                    const match = contentDisp.match(/filename="?([^";]+)"?/);
                    if (match && match[1]) detectedName = match[1];
                }
                setFileName(detectedName);

                let detectedType: 'pdf' | 'image' | 'word' | 'other' = 'image';
                if (mimeType.includes('pdf') || detectedName.endsWith('.pdf')) {
                    detectedType = 'pdf';
                } else if (
                    mimeType.includes('word') ||
                    mimeType.includes('officedocument') ||
                    detectedName.endsWith('.docx') ||
                    detectedName.endsWith('.doc')
                ) {
                    detectedType = 'word';
                } else if (mimeType.includes('image')) {
                    detectedType = 'image';
                }

                setFileType(detectedType);
                activeUrl = URL.createObjectURL(response.data);
                setFileUrl(activeUrl);
            } catch (err) {
                console.error('Failed to load document', err);
                setError('Failed to load document. You may not have permission or the file does not exist.');
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();

        return () => {
            if (activeUrl) URL.revokeObjectURL(activeUrl);
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <Loader className="w-8 h-8 animate-spin text-tactical" />
                <span className="ml-3 text-sm font-semibold tracking-wider uppercase">Loading Document...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <div className="text-red-400 font-bold mb-4">{error}</div>
                <Button variant="outline" onClick={() => window.close()} className="text-xs">
                    Close Window
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative">
            {fileUrl && (
                <>
                    {fileType === 'pdf' ? (
                        <div className="w-full h-screen p-2 flex flex-col">
                            <iframe
                                src={fileUrl}
                                title="Document PDF"
                                className="w-full h-full border border-gray-800 rounded-sm shadow-2xl bg-white"
                            />
                        </div>
                    ) : fileType === 'word' ? (
                        <div className="bg-slate-900 border border-slate-800 p-10 rounded-sm shadow-2xl flex flex-col items-center text-center max-w-md w-full">
                            <div className="w-20 h-20 bg-blue-900/40 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                                <FileText className="w-10 h-10 text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-1">
                                {fileName}
                            </h2>
                            <p className="text-xs text-gray-400 mb-6">
                                Microsoft Word Document (.docx / .doc)
                            </p>
                            <a
                                href={fileUrl}
                                download={fileName}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-sm shadow-md transition-colors"
                            >
                                <Download className="w-4 h-4" /> Download Document
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center max-w-full max-h-screen p-4">
                            <img
                                src={fileUrl}
                                alt="Document"
                                className="max-w-full max-h-[90vh] object-contain shadow-2xl bg-white rounded-sm border border-gray-800"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
