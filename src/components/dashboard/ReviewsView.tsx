import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StarIcon, ThumbsUpIcon, MessageSquareIcon } from 'lucide-react';
import { api } from '../../lib/api';

type Review = {
  id: string;
  productName: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
};

export function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get('/reviews/my-history');
        // Check if pageable or list
        const content = data.content ? data.content : data;

        const mapped = content.map((r: any) => ({
          id: r.id,
          productName: r.productName || 'Unknown Product',
          rating: r.rating,
          date: new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase(),
          comment: r.comment,
          helpful: r.helpfulCount || 0
        }));
        setReviews(mapped);
      } catch (error) {
        console.error('Failed to fetch reviews', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading field reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-tactical pb-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-slate">
          My Field Reports
        </h2>
        <span className="text-xs font-mono text-gray-500">
          SUBMITTED: {reviews.length}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border border-border border-dashed">
          <MessageSquareIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-slate font-bold">No reviews submitted yet.</p>
          <p className="text-sm text-gray-500 mt-1">Purchase gear and share your field experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) =>
            <motion.div
              key={review.id}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: index * 0.1
              }}
              className="bg-white border border-border rounded-sm p-6">

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-tight text-slate mb-1">
                      {review.productName}
                    </h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) =>
                        <StarIcon
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'text-amber fill-amber' : 'text-gray-300'}`} />

                      )}
                      <span className="text-xs text-gray-400 ml-2 font-mono">
                        {review.date}
                      </span>
                    </div>
                  </div>
                  {/* Edit logic would go here */}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-4">
                  "{review.comment}"
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ThumbsUpIcon className="w-3 h-3" />
                  <span>{review.helpful} people found this helpful</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>);
}