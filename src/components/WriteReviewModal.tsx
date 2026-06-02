import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { Button } from './ui/Button';
import { XIcon, StarIcon } from 'lucide-react';
import { api } from '../lib/api';

interface WriteReviewModalProps {
    sellerId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function WriteReviewModal({ sellerId, isOpen, onClose, onSuccess }: WriteReviewModalProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Reviewing: User ID:", user?.id, "Seller ID:", sellerId);

        if (!user) {
            setError('You must be logged in to review');
            return;
        }

        if (user.id === sellerId) {
            setError('You cannot review your own shop');
            return;
        }

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/seller-reviews', {
                sellerId,
                rating,
                comment
            });
            onSuccess();
            onClose();
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Failed to submit review';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-6">Write a Review</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`p-1 hover:scale-110 transition-transform ${rating >= star ? 'text-amber-500' : 'text-gray-300'
                                        }`}
                                >
                                    <StarIcon className="w-8 h-8" fill="currentColor" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border border-gray-300 rounded-sm p-2 h-32 focus:border-tactical focus:ring-1 focus:ring-tactical outline-none resize-none"
                            placeholder="Share your experience..."
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Submit Review
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
