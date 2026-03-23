"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";

import { Outfit, Roboto } from "next/font/google";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useUser } from "@/lib/UserContext";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function RacketDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const supabase = createClient();
  const { id } = use(params);
  const { user } = useUser();
  const [clickedRackets, setClickedRackets] = useState<Set<string>>(new Set());
  const [isFavorited, setIsFavorited] = useState(false);
  const [racket, setRacket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`/api/rackets/fav?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const favoriteIds = data.map((fav: { racket_id: string }) => fav.racket_id);  
        setClickedRackets(new Set(favoriteIds));
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };

    fetchFavorites();
  }, [user]); // Re-runs when user logs in


  useEffect(() => {
    async function fetchRacket() {
      const { data } = await supabase
        .from("racket")
        .select("*")
        .eq("racket_id", id)
        .single();
      
      setRacket(data);
      setLoading(false);
    }
    
    fetchRacket();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // fix unpatched name values by truncating to first 3 words
  const truncate = (name: string, wordCount: number = 4): string => {
    const words = name.split("-");
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.slice(0, wordCount).join(" ");
  };

  const SpecItem = ({ label, value }: { label: string; value: string }) => (
    <div>
      <span className="text-2xl text-gray-500">{label}: </span>
      <span className="text-2xl text-gray-700">{value}</span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <div className="container mx-auto py-12 px-4">
        
        <div
          className={`${outfit.className} bg-white/85 rounded-4xl p-6 shadow-md transition-all duration-300 border border-gray-200 group-hover:border-blue-400 min-h-[700px] flex items-center gap-8`}
        >
          {/* image */}
          <div className="ml-20 w-1/3 flex justify-center bg-white rounded-lg ">
            <img
              src={racket.img_url || "/placeholder-racket.png"}
              alt={racket.name}
              className="w-100 h-100 object-contain"
            />
          </div>
          
          {/* right side */}
          <div className="w-1/2 flex flex-col gap-4 ml-25 mr-20">

          {/* Favorite icon*/}
            <button className="ml-135"
              onClick={async () => {
              if(!user) {
                <Link href="/sign-in">Please sign in to add favorites</Link>
                return;
              }
              const isFavorited = clickedRackets.has(racket.racket_id);

              try {
                const res = await fetch("/api/rackets/fav", {
                  method: isFavorited ? "DELETE" : "POST",
                  body: JSON.stringify({ racketId: racket.racket_id, userId: user.id }),
                  headers: { "Content-Type": "application/json" },
                });
                if (!res.ok) {
                  throw new Error("Failed to update favorites");
                }
                const newFavorites = new Set(clickedRackets);
                if (isFavorited) {
                  newFavorites.delete(racket.racket_id);
                } else {
                  newFavorites.add(racket.racket_id);
                }
                setClickedRackets(newFavorites);
              } catch (err) {
                console.error("Failed to update favorites:", err);
              }

              }}>
              <svg
              className="w-10 h-10"
              fill={clickedRackets.has(racket.racket_id) ? "#ea0e24ff" : "#D1D5DB"}
              viewBox="0 0 20 20"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            {/* description */}
            <h1 className="text-5xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {truncate(racket.name || "", 3)}
            </h1>
            <SpecItem label="Balance" value={racket.balance} />
            <SpecItem label="Weight" value={`${racket.weight}g`} />
            <SpecItem label="Stiffness" value={racket.stiffness} />
            <SpecItem label="Price" value={`$${racket.price}`} />
            <SpecItem label="Available colors" value={racket.color} />

            <a
              href={`https://www.amazon.com/s?k=${truncate(racket.name).replace(/\s/g, "+")}+badminton+racket`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-6 py-3 bg-[#FFC038] text-white tracking-widest font-semibold rounded-full hover:opacity-90 w-max"
            >
              View Retailers
            </a>
          </div>
        </div>
      </div>
    </>
  );
}