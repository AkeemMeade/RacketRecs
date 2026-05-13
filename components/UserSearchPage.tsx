"use client";

import { useState } from "react";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const supabase = createClient();

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function UserSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .eq("is_public", true)
      .ilike("username", `%${query.trim()}%`)
      .limit(20);

    console.log("search results:", data, "error:", error);

    setResults(data || []);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
          Find Players
        </h1>
        <p className="text-white/70 text-sm mb-8">
          Search for other players.
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
            disabled={loading}
            className="px-6 py-3 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-slate-400 italic">No players found matching "{query}".</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.map((profile) => (
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
                      <p className="text-sm font-semibold text-slate-900">{profile.username}</p>
                      {profile.bio && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{profile.bio}</p>
                      )}
                    </div>

                    <span className="text-xs text-blue-400 font-semibold flex-shrink-0">View →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}