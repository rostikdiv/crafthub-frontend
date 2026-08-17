import React, { useState, useEffect } from 'react';
import { StarIcon, ShieldCheckIcon, MessageSquareIcon, ArrowRightIcon } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { Button } from '../ui/Button';
import { useToast } from '../../lib/toastContext';
import { Review } from '../../lib/types';
import { api } from '../../lib/api';

interface ProductReviewsProps {
    productId: string;
    initialReviews?: Review[];
    onReviewsUpdated?: () => void;
}

interface ReviewItemProps {
    review: Review;
    depth?: number;
    replyingToId: string | null;
    setReplyingToId: (id: string | null) => void;
    isAuthenticated: boolean;
    onSubmitReply: (parentId: string, text: string) => Promise<void>;
}

function ReviewItem({ review, depth = 0, replyingToId, setReplyingToId, isAuthenticated, onSubmitReply }: ReviewItemProps) {
    const isReplying = replyingToId === review.id;
    const [localReplyComment, setLocalReplyComment] = useState('');

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localReplyComment.trim()) return;
        await onSubmitReply(review.id, localReplyComment);
        setLocalReplyComment('');
    };

    return (
        <div className={`bg-white border border-border p-6 rounded-sm ${depth > 0 ? 'ml-8 mt-4 border-l-4 border-l-tactical/20' : ''}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate uppercase text-sm">{review.userName}</span>
                        {review.isVerifiedPurchase && (
                            <span className="flex items-center text-[10px] text-green-600 font-bold uppercase tracking-wider gap-1">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                    </div>
                    {review.rating && (
                        <div className="flex text-amber-500 mb-1">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon
                                    key={i}
                                    className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-current' : 'text-gray-200'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{review.date}</span>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm mb-4">{review.comment}</p>

            {/* Reply Button */}
            {isAuthenticated && depth < 3 && (
                <button
                    onClick={() => setReplyingToId(isReplying ? null : review.id)}
                    className="text-xs font-bold uppercase text-gray-400 hover:text-tactical flex items-center gap-1 transition-colors"
                >
                    <MessageSquareIcon className="w-3 h-3" />
                    {isReplying ? 'Cancel Reply' : 'Reply'}
                </button>
            )}

            {/* Reply Form */}
            {isReplying && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleFormSubmit}>
                        <textarea
                            value={localReplyComment}
                            onChange={(e) => setLocalReplyComment(e.target.value)}
                            className="w-full h-24 p-2 text-sm bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-tactical resize-none mb-2"
                            placeholder={`Reply to ${review.userName}...`}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                type="submit"
                                disabled={!localReplyComment.trim()}
                                className="flex items-center gap-2"
                            >
                                Submit Reply <ArrowRightIcon className="w-3 h-3" />
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Nested Replies */}
            {review.replies && review.replies.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                    {review.replies.map(reply => (
                        <ReviewItem
                            key={reply.id}
                            review={reply}
                            depth={depth + 1}
                            replyingToId={replyingToId}
                            setReplyingToId={setReplyingToId}
                            isAuthenticated={isAuthenticated}
                            onSubmitReply={onSubmitReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ProductReviews({ productId, onReviewsUpdated }: ProductReviewsProps) {
    const { user, isAuthenticated } = useAuth();
    const { success, error: showError } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);

    const mapReview = (r: any): Review => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId || 'unknown',
        userName: r.userName || 'Anonymous Operator',
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase || false,
        date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        parentId: r.parentId,
        replies: r.replies ? r.replies.map(mapReview) : []
    });

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reviews/product/${productId}`);
            const fetched = data.content ? data.content : data;
            const mappedReviews: Review[] = fetched.map(mapReview);
            setReviews(mappedReviews);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId]);

    const handleSubmitMain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !comment.trim()) return;

        try {
            await api.post('/reviews', {
                productId,
                rating,
                comment,
                parentId: null
            });
            success('Field report submitted successfully.');
            setComment('');
            setRating(0);
            fetchReviews();
            if (onReviewsUpdated) {
                onReviewsUpdated();
            }
        } catch (err: any) {
            console.error('Submit review failed', err);
            if (err.response?.status === 403) {
                showError('Access Denied: You must purchase this item to verify specs.');
            } else {
                showError('Failed to submit report.');
            }
        }
    };

    const handleReplySubmit = async (parentId: string, text: string) => {
        try {
            await api.post('/reviews', {
                productId,
                rating: null,
                comment: text,
                parentId
            });
            success('Reply submitted successfully.');
            setReplyingToId(null);
            fetchReviews();
            if (onReviewsUpdated) {
                onReviewsUpdated();
            }
        } catch (err: any) {
            console.error('Submit reply failed', err);
            if (err.response?.status === 403) {
                showError('Access Denied: You must purchase this item to verify specs.');
            } else {
                showError('Failed to submit reply.');
            }
        }
    };

    return (
        <div className="mt-12 border-t-2 border-tactical pt-8">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate mb-8">
                Field Reports & Reviews
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <p className="text-gray-500 italic">No field reports filed yet.</p>
                    ) : (
                        reviews.map((review) => (
                            <ReviewItem
                                key={review.id}
                                review={review}
                                replyingToId={replyingToId}
                                setReplyingToId={setReplyingToId}
                                isAuthenticated={isAuthenticated}
                                onSubmitReply={handleReplySubmit}
                            />
                        ))
                    )}
                </div>

                {/* Write Review Form (Main) */}
                <div className="lg:col-span-1">
                    <div className="bg-cream/50 border border-border p-6 rounded-sm sticky top-24">
                        <h3 className="font-bold text-slate uppercase tracking-wide mb-4">
                            Submit Field Report
                        </h3>

                        {!isAuthenticated ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-gray-600 mb-4">
                                    Please sign in to submit a report.
                                </p>
                                <Button variant="outline" className="w-full">
                                    Access Terminal
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitMain} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                        Rating
                                    </label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="focus:outline-none"
                                            >
                                                <StarIcon
                                                    className={`w-6 h-6 transition-colors ${star <= (hoverRating || rating)
                                                        ? 'text-amber-500 fill-current'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                        Comment
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full h-32 p-3 text-sm bg-white border border-border rounded-sm focus:outline-none focus:border-tactical resize-none"
                                        placeholder="Enter your field observations..."
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={rating === 0}>
                                    Submit Report
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
