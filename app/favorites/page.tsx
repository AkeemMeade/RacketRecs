"use client";

import { useState, useEffect } from "react";
import { Outfit } from "next/font/google";
import { useUser } from "@/lib/UserContext";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "700"] });

interface Favorite {
  racket_id: string;
  racket: { name: string; img_url: string };
}

const truncate = (name: string, wordCount = 3): string =>
  name.split("-").slice(0, wordCount)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function FavoritesPage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function fetchFavorites() {
      try {
        const res = await fetch(`/api/rackets/fav?userId=${user?.id}`);
        const data = await res.json();
        setFavorites(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, [user]);

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-8">
          Your Favorites
        </h1>

        <SectionCard
          title="Favorites"
          subtitle={`${favorites.length} saved racket${favorites.length !== 1 ? "s" : ""}`}
        >
          {loading ? (
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
    </main>
  );
}