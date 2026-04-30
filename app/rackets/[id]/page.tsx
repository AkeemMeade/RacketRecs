"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import { Outfit } from "next/font/google";

const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" });
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});
const outfit = Outfit({ subsets: ["latin"], weight: "400" });

const supabase = createClient();

interface RetailerPrice {
  retailer_id: number;
  retailer_name: string;
  price: number;
  product_url: string;
  website: string;
  in_stock: boolean;
}

export default function RacketDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isFavorited, setIsFavorited] = useState(false);
  const [racket, setRacket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [retailers, setRetailers] = useState<RetailerPrice[]>([]);
  const [showRetailers, setShowRetailers] = useState(false);

  // get current user
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    }
    getUser();
  }, []);

  // check if already favorited
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

  // fetch racket and retailers
  useEffect(() => {
    async function fetchRacketAndRetailers() {
      const { data: racketData } = await supabase
        .from("racket")
        .select("*")
        .eq("racket_id", id)
        .single();
      setRacket(racketData);

      const { data: retailerData } = await supabase
        .from("racket_retailer")
        .select(
          `
          retailer_id,
          price,
          product_url,
          in_stock,
          retailer (
            name,
            website
          )
        `,
        )
        .eq("racket_id", id);

      if (retailerData) {
        const formattedRetailers: RetailerPrice[] = retailerData.map(
          (item: any) => ({
            retailer_id: item.retailer_id,
            retailer_name: item.retailer.name,
            price: item.price,
            product_url: item.product_url,
            website: item.retailer.website,
            in_stock: item.in_stock ?? true, // Default to true if null
          }),
        );
        // Sort: in-stock first (by price), then out-of-stock
        formattedRetailers.sort((a, b) => {
          if (a.in_stock && !b.in_stock) return -1;
          if (!a.in_stock && b.in_stock) return 1;
          return a.price - b.price;
        });
        
        setRetailers(formattedRetailers);
        console.log(retailers);
      }

      setLoading(false);
    }
    fetchRacketAndRetailers();
  }, [id]);

  const handleFavorite = async () => {
    if (!userId) return;
    if (isFavorited) {
      await supabase
        .from("favorites")
        .delete()
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-[#FFC038] rounded-full animate-spin" />
      </div>
    );
  }

  const inStockRetailers = retailers.filter(r => r.in_stock);
  const lowestPrice =
    inStockRetailers.length > 0
      ? Math.min(...inStockRetailers.map((r) => r.price)).toFixed(2)
      : null;

  const truncate = (name: string, wordCount = 3): string =>
    name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .slice(0, wordCount)
      .join(" ");

  const getRetailerDisplayName = (name: string) => {
    const nameMap: { [key: string]: string } = {
      yumo: "Yumo",
      joybadminton: "Joy Badminton",
      therallyshop: "The Rally Shop",
    };
    return nameMap[name.toLowerCase()] || name;
  };

  const getRetailerLogo = (name: string) => `/logos/${name.toLowerCase()}.png`;

  const SpecItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <span
        className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}
      >
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
          <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-white/90 shadow-[0_4px_32px_rgba(56,130,200,0.08)] overflow-hidden flex h-[600px] -mt-10">
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
            <div className="flex-1 flex flex-col px-10 py-9 min-h-[440px] overflow-y-auto">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <span
                  className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-sky-600 bg-sky-100 border border-sky-200 px-3 py-1 rounded-full`}
                >
                  Racket
                </span>
                <button
                  onClick={handleFavorite}
                  disabled={!userId}
                  className="w-9 h-9 rounded-full border-2 border-[#FFC038] flex items-center justify-center transition-all hover:bg-[#FFC038] group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  {isFavorited ? (
                    <FavoriteIcon
                      sx={{ fontSize: 18, color: "#FFC038" }}
                      className="group-hover:!text-white"
                    />
                  ) : (
                    <FavoriteBorderOutlinedIcon
                      sx={{ fontSize: 18, color: "#FFC038" }}
                      className="group-hover:!text-white"
                    />
                  )}
                </button>
              </div>

              <h1
                className={`${outfit.className} text-4xl text-black tracking-tight leading-tight mb-1`}
              >
                {truncate(racket.name, 3)}
              </h1>
              <div className="border-t border-sky-100 mb-6" />

              {!showRetailers ? (
                <>
                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
                    <SpecItem label="Balance" value={racket.balance} />
                    <SpecItem label="Weight" value={`3U · ${racket.weight}`} />
                    <SpecItem label="Stiffness" value={racket.stiffness} />
                    <div className="flex flex-col gap-1">
                      <span
                        className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}
                      >
                        Colors
                      </span>
                      <span
                        className={`${dmSans.className} text-sm font-medium text-black`}
                      >
                        {racket.color}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-sky-100 mb-6" />

                  {/* Price */}
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <span
                        className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}
                      >
                        {lowestPrice ? "Starting at" : "Currently Unavailable"}
                      </span>
                      <p
                        className={`${outfit.className} text-4xl text-black leading-tight`}
                      >
                        {lowestPrice ? `$${lowestPrice}` : `$${racket.price}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRetailers(true)}
                      className={`${dmSans.className} px-7 py-3.5 bg-gradient-to-br from-[#FFC038] to-[#e8a820] text-white text-sm font-semibold tracking-wide rounded-full shadow-[0_4px_16px_rgba(255,192,56,0.35)] hover:bg-[#e8a820] hover:cursor-pointer transition-all`}
                    >
                      View Retailers →
                    </button>
                  </div>

                  <div className="border-t border-sky-100 mb-6 mt-6" />

                  {/* Reviews */}
                  <div className="mb-6">
                    <h2
                      className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400 mb-3`}
                    >
                      Reviews
                    </h2>
                    <div className="flex flex-col gap-3">
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`${outfit.className} text-sm font-semibold text-black`}
                          >
                            Username
                          </span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="text-[#FFC038] text-sm"
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className={`${outfit.className} text-sm text-black`}>
                          Review text goes here.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {retailers.length === 0 ? (
                    <div className="mt-4">
                      <p
                        className={`${dmSans.className} text-gray-500 text-base mb-4`}
                      >
                        No retailers currently stock this racket.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mt-2">
                      {retailers.map((retailer) => (
                        <a
                          key={retailer.retailer_id}
                          href={retailer.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            retailer.in_stock
                              ? "bg-white border-sky-100 hover:border-blue-400 hover:shadow-md cursor-pointer"
                              : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                          }`}
                          onClick={(e) => {
                            if (!retailer.in_stock) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden ${
                              retailer.in_stock ? "bg-gray-50" : "bg-gray-100"
                            }`}>
                              <img
                                src={getRetailerLogo(retailer.retailer_name)}
                                alt={getRetailerDisplayName(
                                  retailer.retailer_name,
                                )}
                                className={`w-full h-full object-contain ${
                                  !retailer.in_stock ? "grayscale" : ""
                                }`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                  (
                                    e.target as HTMLImageElement
                                  ).parentElement!.innerHTML =
                                    `<span class="text-lg font-bold ${retailer.in_stock ? "text-gray-600" : "text-gray-400"}">${getRetailerDisplayName(retailer.retailer_name)[0]}</span>`;
                                }}
                              />
                            </div>
                            <div>
                              <p
                                className={`${dmSans.className} text-sm font-semibold ${
                                  retailer.in_stock ? "text-gray-900" : "text-gray-400"
                                }`}
                              >
                                {getRetailerDisplayName(retailer.retailer_name)}
                              </p>
                              <p
                                className={`${dmSans.className} text-xs ${
                                  retailer.in_stock ? "text-gray-400" : "text-gray-300"
                                }`}
                              >
                                {retailer.in_stock ? retailer.website : "Out of stock"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {retailer.in_stock ? (
                              <>
                                <p
                                  className={`${outfit.className} text-xl font-bold text-gray-900`}
                                >
                                  ${retailer.price.toFixed(2)}
                                </p>
                                <p
                                  className={`${dmSans.className} text-xs text-blue-400`}
                                >
                                  View at store →
                                </p>
                              </>
                            ) : (
                              <p
                                className={`${dmSans.className} text-sm font-semibold text-gray-400`}
                              >
                                Out of Stock
                              </p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowRetailers(false)}
                    className={`${dmSans.className} mt-4 px-6 py-2.5 bg-sky-50 text-sky-600 text-sm font-semibold rounded-full hover:bg-sky-100 transition-all w-max hover:cursor-pointer`}
                  >
                    ← Back to Specs
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
