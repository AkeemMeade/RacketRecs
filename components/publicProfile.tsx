"use client";

import { useState, useEffect, use } from "react";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import { PostsTab } from "./postsTab";
import { MarketplaceTab } from "@/components/MarketplaceTab";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const supabase = createClient();

interface Profile {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  {/*"Favorites", "Activity"*/}
  const tabs = ["Marketplace", "Posts"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Marketplace");

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, bio, avatar_url, is_public")
        .eq("username", username)
        .single();


      if (!data?.is_public) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-lg font-semibold">This profile is private or does not exist.</p>
      </div>
    );
  }

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <main className={`${outfit.className}`}>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 -mt-10">

        {/* Profile card */}
        <div className="rounded-2xl bg-white/85 shadow-xl backdrop-blur-md overflow-hidden ring-2 ring-white">

          {/* Banner */}
          <div className="h-36 bg-gradient-to-r from-sky-300" />

          <div className="px-8 py-8 md:px-10 md:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#FFC038] ring-4 ring-white shadow-lg flex items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    {profile?.username || "Anonymous"}
                  </h1>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 mb-4">About</h2>
              <div className="text-sm text-slate-600 leading-relaxed">
                {profile?.bio || (
                  <span className="text-slate-400 italic">
                    This user has not added a bio yet.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl bg-white/90 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${activeTab === tab
                      ? "bg-[#FFC038] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-8">
            {activeTab === "Marketplace" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Marketplace</h2>
                <p className="mt-2 text-sm text-slate-500">Browse rackets and offers from this user.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Marketplace content goes here.
                </div>
              </div>
            )}

            {activeTab === "Posts" && profile !== null && (
              <PostsTab userId={profile?.id ?? ""} isOwner={false} username={username} />
            )}

            {/*
            {activeTab === "Favorites" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Favorites</h2>
                <p className="mt-2 text-sm text-slate-500">Rackets saved by this user.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Favorites content goes here.
                </div>
              </div>
            )}

            
            {activeTab === "Activity" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Activity</h2>
                <p className="mt-2 text-sm text-slate-500">Recent activity from this user.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Activity content goes here.
                </div>
              </div>
            )}
              */}
          </div>
        </div>

      </div>
    </main>
  );
}