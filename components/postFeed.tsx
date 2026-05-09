"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const supabase = createClient();

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export default function PostsFeedPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const startPostId = searchParams.get("postId");

  useEffect(() => {
    async function fetchData() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      setPosts(data || []);
      setLoading(false);
    }
    fetchData();
  }, [username]);

  useEffect(() => {
    if (!startPostId || loading) return;
    const el = document.getElementById(`post-${startPostId}`);
    if (el) el.scrollIntoView({ behavior: "instant" });
  }, [startPostId, loading]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
  <main className={`${outfit.className} min-h-screen`}>
    <div className="max-w-3xl mx-auto px-4 py-6">

      <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
        Posts
      </h1>
      <p className="text-white/70 text-sm mb-6">
        {posts.length} post{posts.length !== 1 ? "s" : ""} by {username}
      </p>

      {/* Posts container */}
      <div className="rounded-2xl bg-white/70 shadow-xl ring-1 ring-white/30 backdrop-blur-md overflow-hidden">

        <div className="px-8 py-4 border-b border-white/30 mt-5">
          <button
            onClick={() => router.push(`/profile/${username}`)}
            className="px-7 py-3 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition
             flex items-center gap-2 cursor-pointer shadow-md mb-5"
          >
            ← Back to {username}'s profile
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="px-8 py-10 text-center text-sm text-white/60 italic">
            No posts yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post, index) => (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className={`p-8 ${
                  index !== posts.length - 1
                    ? "border-b-4 border-white/100"
                    : ""
                }`}
              >
                <img
                  src={post.image_url}
                  alt="post"
                  className="w-full object-cover rounded-2xl mb-5 shadow-lg ring-1 ring-black/5"
                />
                {post.caption && (
                  <p className="text-slate-800 text-sm font-medium mb-2">{post.caption}</p>
                )}
                <p className="text-slate-400 text-xs">
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </main>
);
}