import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader } from 'lucide-react';

export function ViewDocument() {
    const { id } = useParams<{ id: string }>();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchImage = async () => {
            try {
                // Fetch the image from our backend proxy.
                // We MUST use axios/api client to include the Authorization header.
                const response = await api.get(`/documents/${id}`, {
                    responseType: 'blob'
                });

                // Create a local URL for the blob
                const url = URL.createObjectURL(response.data);
                setImageUrl(url);
            } catch (err) {
                console.error('Failed to load document', err);
                setError('Failed to load document. You may not have permission or the file does not exist.');
            } finally {
                setLoading(false);
            }
        };

        fetchImage();

        // Cleanup
        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Loader className="w-8 h-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading document...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-red-500 font-bold">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="Document"
                    className="max-w-full max-h-screen object-contain shadow-2xl bg-white"
                />
            )}
        </div>
    );
}
