"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StarRatingProps {
  racketId: number;
}

export default function StarRating({ racketId }: StarRatingProps) {
  const { user } = useUser();
  const [hovered, setHovered] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [pendingStar, setPendingStar] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const params = new URLSearchParams({ racketId: String(racketId) });
      if (user?.id) params.append("userId", user.id);

      const res = await fetch(`/api/rackets/review?${params}`);
      const data = await res.json();
      setAverage(data.average ?? null);
      setCount(data.count ?? 0);
      setUserRating(data.userRating ?? null);
    };

    fetchReviews();
  }, [racketId, user]);

  const handleStarClick = (star: number) => {
    if (!user) {
      alert("Please sign in to leave a rating.");
      return;
    }
    setPendingStar(star);
    setComment("");
    setVideoFile(null);
    setVideoError(null);
    setShowModal(true);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setVideoError(null);

    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setVideoError("Video must be under 50MB.");
      setVideoFile(null);
      return;
    }

    const allowed = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowed.includes(file.type)) {
      setVideoError("Only MP4, MOV, or WebM files are allowed.");
      setVideoFile(null);
      return;
    }

    setVideoFile(file);
  };

  const handleSubmit = async () => {
    if (pendingStar === null) return;
    setSubmitting(true);

    try {
      let videoUrl: string | null = null;

      // Upload video to Supabase Storage if provided
      if (videoFile) {
        setUploadProgress("Uploading video...");
        const ext = videoFile.name.split(".").pop();
        const fileName = `${user!.id}-${racketId}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("review-videos")
          .upload(fileName, videoFile, { upsert: true });

        if (uploadError) throw new Error("Video upload failed: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("review-videos")
          .getPublicUrl(fileName);

        videoUrl = urlData.publicUrl;
        setUploadProgress(null);
      }

      // Submit review to API
      const res = await fetch("/api/rackets/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          racketId,
          userId: user!.id,
          rating: pendingStar,
          comment: comment.trim() || null,
          videoUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setUserRating(pendingStar);
      setAverage((prev) =>
        prev === null
          ? pendingStar
          : parseFloat(
              (
                (prev * count + pendingStar) /
                (count + (userRating === null ? 1 : 0))
              ).toFixed(1)
            )
      );
      if (userRating === null) setCount((c) => c + 1);
      setShowModal(false);
      setVideoFile(null);
    } catch (err) {
      console.error(err);
      setVideoError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const displayed = hovered ?? userRating ?? 0;

  return (
    <>
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={submitting}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              className="transition-transform hover:scale-110 disabled:opacity-50"
            >
              <svg
                className="w-8 h-8"
                fill={star <= displayed ? "#FBBF24" : "#D1D5DB"}
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500">
          {average !== null
            ? `${average.toFixed(1)} / 5 · ${count} review${count !== 1 ? "s" : ""}`
            : "No ratings yet"}
        </p>

        {userRating && (
          <p className="text-xs text-blue-500">You rated this {userRating}/5</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900">Rate this racket</h2>

            {/* Stars in modal */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setPendingStar(star)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className="w-8 h-8"
                    fill={star <= (pendingStar ?? 0) ? "#FBBF24" : "#D1D5DB"}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />

            {/* Video upload */}
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-500">Upload a video (optional, max 50MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-400 transition"
              >
                {videoFile ? `✓ ${videoFile.name}` : "Click to choose a video"}
              </button>
              {videoFile && (
                <button
                  onClick={() => {
                    setVideoFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-red-400 hover:text-red-500 text-left"
                >
                  Remove video
                </button>
              )}
              {videoError && (
                <p className="text-xs text-red-500">{videoError}</p>
              )}
              {uploadProgress && (
                <p className="text-xs text-blue-500">{uploadProgress}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setVideoFile(null);
                  setVideoError(null);
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || pendingStar === null}
                className="px-4 py-2 rounded-full bg-blue-500 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
              >
                {submitting ? uploadProgress ?? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}