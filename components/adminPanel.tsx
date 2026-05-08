"use client";

import { useState, useEffect } from "react";
import { Outfit } from "next/font/google";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const supabase = createClient();

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_public: boolean;
}

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  username?: string;
}

interface Listing {
  id: string;
  racket_name: string;
  seller_name: string;
  contact_email: string;
  price: string;
  condition: string;
  status: string;
  brand: string;
  location: string;
  created_at: string;
}

function SectionCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function ConfirmModal({ title, description, onConfirm, onCancel }: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

const tabs = ["Users", "Posts", "Marketplace"] as const;
type Tab = typeof tabs[number];

export default function adminPanel() {
  const { user, isAdmin, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Users");

  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [modal, setModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, loading]);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchAll() {
      const [{ data: profilesData }, { data: postsData, error: postsError }, { data: listingsData }] = await Promise.all([
        supabase.from("profiles").select("id, username, avatar_url, is_public").eq("is_public", true),
        supabase.from("posts").select("id, image_url, caption, created_at, user_id").order("created_at", { ascending: false }),
        supabase.from("marketplace_listings").select("id, racket_name, seller_name, contact_email, price, condition, status, brand, location, created_at").order("created_at", { ascending: false }),
      ]);

      const enrichedPosts = (postsData || []).map((post) => ({
        ...post,
        username: profilesData?.find((p) => p.id === post.user_id)?.username || "Unknown",
      }));

      setUsers(profilesData || []);
      setPosts(enrichedPosts);
      setListings(listingsData || []);

      setUsers(profilesData || []);
      setPosts(postsData || []);
      setListings(listingsData || []);
      setLoadingData(false);
    }
    fetchAll();
  }, [isAdmin]);

  const confirm = (title: string, description: string, onConfirm: () => void) => {
    setModal({ title, description, onConfirm });
  };

  const handleDeleteUser = async (userId: string) => {
    await fetch("/api/user/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setPosts((prev) => prev.filter((p) => p.user_id !== userId));
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleDeleteListing = async (listingId: string) => {
    await supabase.from("marketplace_listings").delete().eq("id", listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  if (loading || loadingData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <main className={`${outfit.className} min-h-screen`}>
      {modal && (
        <ConfirmModal
          title={modal.title}
          description={modal.description}
          onConfirm={() => { modal.onConfirm(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
          Admin Panel
        </h1>
        <p className="text-white/70 text-sm mb-8">Manage users, posts, and marketplace listings.</p>

        <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden">

          {/* Tabs inside card header */}
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer ${activeTab === tab
                      ? "bg-[#FFC038] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-6 py-8">

            {activeTab === "Users" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Public Users</h2>
                <p className="text-sm text-slate-500 mb-6">{users.length} public users</p>
                {users.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No public users.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-3 gap-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#FFC038] flex items-center justify-center text-white text-xs font-bold">
                              {u.username?.slice(0, 2).toUpperCase() ?? "??"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{u.username || "No username"}</p>
                            <p className="text-xs text-slate-400">{u.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => confirm(
                            "Delete user?",
                            `This will permanently delete ${u.username || "this user"} and all their data.`,
                            () => handleDeleteUser(u.id)
                          )}
                          className="px-4 py-1.5 rounded-full border-2 border-red-300 text-red-500 text-xs font-semibold hover:bg-red-50 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Posts" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">All Posts</h2>
                <p className="text-sm text-slate-500 mb-6">{posts.length} posts</p>
                {posts.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No posts.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {posts.map((post) => (
                      <div key={post.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <img src={post.image_url} alt="post" className="w-full h-40 object-cover" />
                        <div className="px-4 py-3">
                          <p className="text-xs text-slate-500 mb-1">
                            By <span className="font-semibold">{post.username}</span>
                          </p>
                          {post.caption && <p className="text-sm text-slate-700 mb-2 line-clamp-2">{post.caption}</p>}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                              {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <button
                              onClick={() => confirm(
                                "Delete post?",
                                "This will permanently delete this post.",
                                () => handleDeletePost(post.id)
                              )}
                              className="text-xs text-red-400 hover:text-red-600 transition font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Marketplace" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Marketplace Listings</h2>
                <p className="text-sm text-slate-500 mb-6">{listings.length} listings</p>
                {listings.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No listings.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {listings.map((listing) => (
                      <div key={listing.id} className="py-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{listing.racket_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{listing.brand} · {listing.condition} · ${listing.price}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{listing.seller_name} · {listing.location}</p>
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${listing.status === "Sold" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                            }`}>
                            {listing.status}
                          </span>
                        </div>
                        <button
                          onClick={() => confirm(
                            "Delete listing?",
                            `This will permanently delete the listing for ${listing.racket_name}.`,
                            () => handleDeleteListing(listing.id)
                          )}
                          className="px-4 py-1.5 rounded-full border-2 border-red-300 text-red-500 text-xs font-semibold hover:bg-red-50 transition shrink-0 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}