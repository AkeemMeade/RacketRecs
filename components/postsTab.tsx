"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export function PostsTab({ userId, isOwner, username }: { 
  userId: string; 
  isOwner: boolean;
  username: string;
}) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    }
    fetchPosts();
  }, [userId]);

  const handleUpload = async () => {
    if (!previewFile || !userId) return;
    setUploading(true);

    const fileExt = previewFile.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(fileName, previewFile);

    if (uploadError) {
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);

    const { data: post } = await supabase
      .from("posts")
      .insert({ user_id: userId, image_url: urlData.publicUrl, caption })
      .select()
      .single();

    if (post) setPosts((prev) => [post, ...prev]);
    setCaption("");
    setPreviewFile(null);
    setUploading(false);
    setShowUploadForm(false);
  };

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Posts</h2>
          <p className="mt-1 text-sm text-slate-500">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Upload section */}
      {isOwner && (
        <div className="mb-8">
          {!showUploadForm ? (
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-5 py-2 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              + Create Post
            </button>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">New post</p>
                <button
                  onClick={() => { setShowUploadForm(false); setPreviewFile(null); setCaption(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <label className="flex items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-[#FFC038] transition bg-white mb-3">
                {previewFile ? (
                  <img
                    src={URL.createObjectURL(previewFile)}
                    alt="preview"
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-sm text-slate-400">Click to select an image</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPreviewFile(e.target.files?.[0] || null)}
                />
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#FFC038] resize-none mb-3"
              />
              <button
                onClick={handleUpload}
                disabled={!previewFile || uploading}
                className="px-5 py-2 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {uploading ? "Uploading..." : "Post"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400 italic">
          {isOwner ? "No posts yet. Share something!" : "This user hasn't posted yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/profile/${username}/posts?postId=${post.id}`)}
              className="rounded-2xl border border-slate-200 overflow-hidden bg-white cursor-pointer hover:shadow-md transition"
            >
              <img
                src={post.image_url}
                alt="post"
                className="w-full h-48 object-cover"
              />
              <div className="px-4 py-3">
                {post.caption && (
                  <p className="text-sm text-slate-700 mb-2">{post.caption}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {isOwner && (
                    <button
                      onClick={(e) => handleDelete(post.id, e)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}