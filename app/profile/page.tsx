"use client";

import React, { useState, useEffect } from "react";
import { Outfit } from "next/font/google";
import { useUser } from "@/lib/UserContext";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

interface Favorite {
  racket_id: string;
  racket: {
    name: string;
    img_url: string;
  };
}

export default function ProfilePage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`/api/rackets/fav?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setFavorites(data);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      } finally {
        setLoadingFavs(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const truncate = (name: string, wordCount = 3): string => {
    const words = name.split("-");
    return words
      .slice(0, wordCount)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <main className={`${outfit.className} min-h-screen -mt-25`}>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <div className="mx-auto w-full max-w-6xl px-4 py-10"></div>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            My Profile
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Your account dashboard will appear here once authentication and user
            data are connected.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <SectionCard
              title="Personal Information"
              subtitle="User details will populate here."
              right={
                <Link
                  href="/preferences"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
                >
                  Preferences
                </Link>
              }
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">No user data loaded.</p>
              </div>
            </SectionCard>

            {/* Favorites */}
            <SectionCard
              title="Favorites"
              subtitle={`${favorites.length} saved racket${favorites.length !== 1 ? "s" : ""}`}
            >
              {loadingFavs ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : !user ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">Sign in to see favorites.</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">No favorites yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <Link
                      key={fav.racket_id}
                      href={`/rackets/${fav.racket_id}`}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100 hover:ring-blue-400 hover:bg-blue-50 transition"
                    >
                      <img
                        src={fav.racket?.img_url || "/placeholder-racket.png"}
                        alt={fav.racket?.name}
                        className="h-12 w-12 object-contain shrink-0"
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        {truncate(fav.racket?.name || "", 3)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Player Assessment"
              subtitle="Assessment results will display here."
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">Assessment data not available.</p>
              </div>
            </SectionCard>

            <SectionCard
              title="Recommendations"
              subtitle="Personalized racket recommendations will appear here."
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">No recommendations yet.</p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}