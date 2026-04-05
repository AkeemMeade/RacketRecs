"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import { Outfit } from "next/font/google";

const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const outfit = Outfit({ subsets: ["latin"], weight: "400" });

const supabase = createClient();

export default function RacketDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isFavorited, setIsFavorited] = useState(false);
  const [racket, setRacket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  }
  getUser();
}, []);

useEffect(() => {
  if (!userId || !id) return;
  async function checkFavorite() {
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("racket_id", id)
      .single();
    setIsFavorited(!!data);
  }
  checkFavorite();
}, [userId, id]);

const handleFavorite = async () => {
  if (!userId) return;
  if (isFavorited) {
    await supabase.from("favorites").delete()
      .eq("user_id", userId)
      .eq("racket_id", id);
  } else {
    await supabase.from("favorites").insert({
      user_id: userId,
      racket_id: id,
    });
  }
  setIsFavorited(!isFavorited);
};

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-[#FFC038] rounded-full animate-spin" />
      </div>
    );
  }

  const truncate = (name: string, wordCount = 3): string =>
    name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .slice(0, wordCount)
      .join(" ");

  const colors = (racket.color as string)
    ?.split(",")
    .map((c) => c.trim().toLowerCase()) ?? [];

  const SpecItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <span className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}>
        {label}
      </span>
      <span className={`${dmSans.className} text-base font-medium text-black`}>
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <div className="container mx-auto py-14 px-4 max-w-5xl">

        <div className="flex flex-col -mt-10">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-white/90 shadow-[0_4px_32px_rgba(56,130,200,0.08)] overflow-hidden flex min-h-[440px] -mt-10">

          {/* Image panel */}
          <div className="w-5/12 bg-gradient-to-br from-slate-50 to-sky-200 border-r border-sky-100 flex items-center justify-center p-10 relative">
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3/5 h-3 rounded-full bg-sky-200/40 blur-md" />
            <img
              src={racket.img_url || "/placeholder-racket.png"}
              alt={truncate(racket.name, 3)}
              className="w-72 h-72 object-contain drop-shadow-[0_8px_24px_rgba(56,130,200,0.18)] rounded-3xl"
            />
          </div>

          {/* Content panel */}
          <div className="flex-1 flex flex-col px-10 py-9">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-5">
              <span className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-sky-600 bg-sky-100 border border-sky-200 px-3 py-1 rounded-full`}>
                Racket
              </span>
              <button
                onClick={handleFavorite}
                disabled={!userId}
                className="w-9 h-9 rounded-full border-2 border-[#FFC038] flex items-center justify-center transition-all hover:bg-[#FFC038] group"
              >
                {isFavorited ? (
                  <FavoriteIcon sx={{ fontSize: 18, color: "#FFC038" }} className="group-hover:!text-white" />
                ) : (
                  <FavoriteBorderOutlinedIcon sx={{ fontSize: 18, color: "#FFC038" }} className="group-hover:!text-white" />
                )}
              </button>
            </div>


            <h1 className={`${outfit.className} text-4xl text-black tracking-tight leading-tight mb-1`}>
              {truncate(racket.name, 3)}
            </h1>
            <div className="border-t border-sky-100 mb-6" />

            {/* Specs */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
              <SpecItem label="Balance" value={`${racket.balance}`} />
              <SpecItem label="Weight" value={`3U · ${racket.weight}`} />
              <SpecItem label="Stiffness" value={racket.stiffness} />
              <div className="flex flex-col gap-1">
                <span className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}>
                  Colors
                </span>
                <div className="flex items-center gap-2">
                  <span className={`${dmSans.className} text-sm font-medium text-black`}>
                    {racket.color}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-sky-100 mb-6" />

            {/* Price */}
            <div className="flex items-end justify-between mt-auto">
              <div>
                <span className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}>
                  Retail Price
                </span>
                <p className={`${outfit.className} text-4xl text-black leading-tight`}>
                  ${racket.price}
                </p>
              </div>
              
              <a
                href={`https://www.amazon.com/s?k=${truncate(racket.name).replace(/\s/g, "+")}+badminton+racket`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${dmSans.className} px-7 py-3.5 bg-gradient-to-br from-[#FFC038] to-[#e8a820] text-white text-sm font-semibold tracking-wide rounded-full shadow-[0_4px_16px_rgba(255,192,56,0.35)] hover:shadow-[0_6px_20px_rgba(255,192,56,0.45)] transition-all`}
              >
                View Retailers →
              </a>
            </div>

            <div className="border-t border-sky-100 mb-6" />

            {/* Reviews */}
            <div className="mb-6">
              <h2 className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400 mb-3`}>
                Reviews
              </h2>
              <div className="flex flex-col gap-3">
                <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`${outfit.className} text-sm font-semibold text-black`}>Username</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((star) => (
                        <span key={star} className="text-[#FFC038] text-sm">★</span>
                      ))}
                    </div>
                  </div>
                  <p className={`${outfit.className} text-sm text-black`}>Review text goes here.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        </div>
      </div>
    </>
  );
}