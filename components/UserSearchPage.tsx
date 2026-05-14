"use client";

import { useState, useEffect } from "react";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const supabase = createClient();

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function UserSearchPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Fetch all public posts on load
  useEffect(() => {
    const fetchPublicPosts = async () => {
      try {
        // First, get all public profile IDs
        const { data: publicProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("is_public", true);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
          setLoading(false);
          return;
        }

        if (!publicProfiles || publicProfiles.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Get all public profile IDs
        const publicUserIds = publicProfiles.map((p) => p.id);

        // Fetch posts from public profiles
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("id, image_url, caption, created_at, user_id")
          .in("user_id", publicUserIds)
          .order("created_at", { ascending: false })
          .limit(100);

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          setLoading(false);
          return;
        }

        // Combine posts with user info
        const enrichedPosts = (postsData || []).map((post) => {
          const profile = publicProfiles.find((p) => p.id === post.user_id);
          return {
            ...post,
            username: profile?.username || "Unknown",
            avatar_url: profile?.avatar_url || null,
          };
        });

        setPosts(enrichedPosts);
      } catch (error) {
        console.error("Error:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPosts();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .eq("is_public", true)
      .ilike("username", `%${query.trim()}%`)
      .limit(20);

    if (error) {
      console.error("Search error:", error);
    }
    setSearchResults(data || []);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setQuery("");
    setSearched(false);
    setSearchResults([]);
  };

  return (
    <main className={`${outfit.className} min-h-screen flex justify-center`}>
      <div className="w-full max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
          Find Players
        </h1>
        <p className="text-white/70 text-sm mb-8">
          Search for other players or explore posts from other accounts.
        </p>

        {/* Search input */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by username..."
            className="flex-1 px-5 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#FFC038] transition"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        {searched && (
          <>
            <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden mb-8">
              {searchResults.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-slate-400 italic">
                    No players found matching "{query}".
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/profile/${profile.username}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50 transition"
                    >
                      {/* Avatar */}
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username || "avatar"}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#FFC038] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {profile.username?.slice(0, 2).toUpperCase() ?? "??"}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {profile.username}
                        </p>
                        {profile.bio && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      <span className="text-xs text-blue-400 font-semibold flex-shrink-0">
                        View →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={clearSearch}
              className="mb-8 px-4 py-2 rounded-full bg-slate-400 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Clear Search
            </button>
          </>
        )}

        {/* Explore Posts Section */}
        {!searched && (
          <>
            <h2 className="text-2xl font-bold text-white mt-10 mb-6">
              Explore Posts
            </h2>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/60 text-sm">No posts available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/profile/${post.username}?postId=${post.id}`}
                    className="rounded-lg bg-white/90 shadow-lg hover:shadow-xl transition overflow-hidden cursor-pointer group"
                  >
                    {/* Image */}
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-200">
                      <img
                        src={post.image_url}
                        alt={post.caption || "post"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* User info */}
                      <div className="flex items-center gap-2 mb-2">
                        {post.avatar_url ? (
                          <img
                            src={post.avatar_url}
                            alt={post.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#FFC038] flex items-center justify-center text-white text-xs font-bold">
                            {post.username?.slice(0, 2).toUpperCase() ?? "??"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {post.username}
                          </p>
                        </div>
                      </div>

                      {/* Caption */}
                      {post.caption && (
                        <p className="text-xs text-slate-700 line-clamp-2">
                          {post.caption}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
