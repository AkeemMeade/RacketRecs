"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Outfit } from "next/font/google";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CiCirclePlus } from "react-icons/ci";
import { FaEdit } from "react-icons/fa";


const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const supabase = createClient();

interface Profile {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", user!.id)
        .single();
      setProfile(data);
      setBioDraft(data?.bio ?? "");
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  const profilePicture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Failed to upload image. Please try again.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatar_url = publicUrlData.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url })
      .eq("id", user.id);

    setProfile((prev) => prev ? { ...prev, avatar_url } : prev);
  };

  const handleBioSave = async () => {
    if (!user) return;
    if (bioDraft === profile?.bio) return;

    setIsSavingBio(true);

    const { error } = await supabase
      .from("profiles")
      .update({ bio: bioDraft })
      .eq("id", user.id);

    setIsSavingBio(false);

    if (error) {
      console.error("Bio save error:", error);
      alert("Failed to save bio. Please try again.");
      return;
    }

    setProfile((prev) => (prev ? { ...prev, bio: bioDraft } : prev));
    setIsEditingBio(false);
  };

  const handleBioEdit = () => {
    setIsEditingBio(true);
    setBioDraft(profile?.bio ?? "");
  };

  const handleBioCancel = () => {
    setBioDraft(profile?.bio ?? "");
    setIsEditingBio(false);
  };

  const tabs = ["Marketplace", "Posts", "Favorites", "Activity"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Marketplace");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase();

  return (
    <main className={`${outfit.className} `}>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 -mt-10">
        <div className="rounded-2xl bg-white/85 shadow-xl backdrop-blur-md overflow-hidden ring-2 ring-[white]">

          {/* Banner */}
          {/* edit banner color*/}
          
          <div className="h-36 bg-gradient-to-r from-blue-900"/>  
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
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                    <CiCirclePlus className="text-3xl text-slate-500" />
                    <input type="file" accept="image/*" className="hidden" onChange={profilePicture} />
                  </label>
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    {profile?.username || "No username set"}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
                  <p className="text-xs text-slate-400 mt-3">
                    Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>

              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFC038] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FFD700] transition"
              >
                <FaEdit className="h-4 w-4" />
                Edit profile
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">About</h2>
                <button
                  type="button"
                  onClick={handleBioEdit}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#FFC038] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#FFD700]"
                >
                  <FaEdit className="h-3.5 w-3.5" />
                  Edit bio
                </button>
              </div>

              {!isEditingBio ? (
                <div className="mt-4 text-sm text-slate-600 leading-relaxed">
                  {profile?.bio || (
                    <span className="text-slate-400 italic">
                      No bio yet. Add a short description about yourself so people know more about your playing style and preferences.
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    id="bio"
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    rows={5}
                    className="mt-4 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Write a short bio about yourself..."
                  />

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <p className="text-xs text-slate-500">{bioDraft.length} / 240 characters</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleBioSave}
                        disabled={isSavingBio || bioDraft === profile?.bio}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {isSavingBio ? "Saving..." : "Save bio"}
                      </button>
                      <button
                        type="button"
                        onClick={handleBioCancel}
                        disabled={isSavingBio}
                        className="rounded-full cursor-pointer border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                    activeTab === tab
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
                <p className="mt-2 text-sm text-slate-500">Browse rackets, view offers, and manage your marketplace activity.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Marketplace content goes here.
                </div>
              </div>
            )}

            {activeTab === "Posts" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Posts</h2>
                <p className="mt-2 text-sm text-slate-500">Review your recent posts and community activity.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Posts content goes here.
                </div>
              </div>
            )}

            {activeTab === "Favorites" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Favorites</h2>
                <p className="mt-2 text-sm text-slate-500">See your saved rackets and preferences.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Favorites content goes here.
                </div>
              </div>
            )}

            {activeTab === "Activity" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Activity</h2>
                <p className="mt-2 text-sm text-slate-500">Track your latest activity, reviews, and account changes.</p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Activity content goes here.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}