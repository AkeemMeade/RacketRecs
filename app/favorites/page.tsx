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

export default function FavoritesPage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function fetchFavorites() {
      try {
        const res = await fetch(`/api/rackets/fav?userId=${user.id}`);
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

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <p className="text-white/80">Sign in to see your favorites.</p>
        ) : favorites.length === 0 ? (
          <p className="text-white/80">No favorites yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <Link
                key={fav.racket_id}
                href={`/rackets/${fav.racket_id}`}
                className="bg-white/85 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center gap-3 hover:ring-2 hover:ring-blue-400 transition"
              >
                <img
                  src={fav.racket?.img_url || "/placeholder-racket.png"}
                  alt={fav.racket?.name}
                  className="h-36 w-36 object-contain"
                />
                <span className="text-sm font-semibold text-slate-800 text-center">
                  {truncate(fav.racket?.name || "", 3)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}