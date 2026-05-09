"use client";

import { useState, useEffect } from "react";

interface Review {
  review_id: string;
  rating: number;
  comment: string | null;
  video_url: string | null;
  date_created: string;
}

interface ReviewsSectionProps {
  racketId: number;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-4 h-4"
          fill={star <= rating ? "#FBBF24" : "#D1D5DB"}
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection({ racketId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/rackets/review/all?racketId=${racketId}`);
        if (!res.ok) return;
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [racketId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 pb-12">
      <div className="bg-white/85 rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Reviews{" "}
          <span className="text-slate-400 font-normal text-lg">
            ({reviews.length})
          </span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-10 text-center ring-1 ring-slate-100">
            <p className="text-slate-500">
              No reviews yet. Be the first to review this racket!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review.review_id}
                className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-5 flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-sm">
                      A
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Anonymous
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(review.date_created)}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} />
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-slate-700">{review.comment}</p>
                )}

                {/* Video */}
                {review.video_url && (
                  <video
                    src={review.video_url}
                    controls
                    className="w-full max-h-72 rounded-xl object-cover bg-black"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}