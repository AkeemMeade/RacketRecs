"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { Outfit, Roboto } from "next/font/google";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import { useUser } from "@/lib/UserContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface RetailerPrice {
  retailer_id: number;
  retailer_name: string;
  price: number;
  product_url: string;
  website: string;
}

export default function RacketDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useUser();
  const [clickedRackets, setClickedRackets] = useState<Set<string>>(new Set());
  const [isFavorited, setIsFavorited] = useState(false);
  const [racket, setRacket] = useState<any>(null);
  const [retailers, setRetailers] = useState<RetailerPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRetailers, setShowRetailers] = useState(false); // Toggle state

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`/api/rackets/fav?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const favoriteIds = data.map(
          (fav: { racket_id: string }) => fav.racket_id,
        );
        setClickedRackets(new Set(favoriteIds));
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    async function fetchRacketAndRetailers() {
      // Fetch racket details
      const { data: racketData } = await supabase
        .from("racket")
        .select("*")
        .eq("racket_id", id)
        .single();

      setRacket(racketData);

      // Fetch retailer prices for this racket
      const { data: retailerData } = await supabase
        .from("racket_retailer")
        .select(
          `
          retailer_id,
          price,
          product_url,
          retailer (
            name,
            website
          )
        `,
        )
        .eq("racket_id", id);

      if (retailerData) {
        // Transform the data
        const formattedRetailers: RetailerPrice[] = retailerData.map(
          (item: any) => ({
            retailer_id: item.retailer_id,
            retailer_name: item.retailer.name,
            price: item.price,
            product_url: item.product_url,
            website: item.retailer.website,
          }),
        );

        // Sort by price (lowest first)
        formattedRetailers.sort((a, b) => a.price - b.price);
        setRetailers(formattedRetailers);
      }

      setLoading(false);
    }

    fetchRacketAndRetailers();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Calculate lowest price
  const lowestPrice =
    retailers.length > 0
      ? Math.min(...retailers.map((r) => r.price)).toFixed(2)
      : "N/A";

  // Fix unpatched name values by truncating to first 3 words
  const truncate = (name: string, wordCount: number = 4): string => {
    const words = name.split("-");
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1),
    );
    return capitalizedWords.slice(0, wordCount).join(" ");
  };

  const SpecItem = ({ label, value }: { label: string; value: string }) => (
    <div>
      <span className="text-2xl text-gray-500">{label}: </span>
      <span className="text-2xl text-gray-700">{value}</span>
    </div>
  );

  // Retailer logo/name display helper
  const getRetailerDisplayName = (name: string) => {
    const nameMap: { [key: string]: string } = {
      yumo: "Yumo",
      joybadminton: "Joy Badminton",
      therallyshop: "The Rally Shop",
    };
    return nameMap[name.toLowerCase()] || name;
  };

  // Get retailer logo path
  const getRetailerLogo = (name: string) => {
    return `/logos/${name.toLowerCase()}.png`;
  };

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
            {/* Favorite icon */}
            <button
              className="ml-135"
              onClick={async () => {
                if (!user) {
                  alert("Please sign in to add favorites");
                  return;
                }
                const isFavorited = clickedRackets.has(racket.racket_id);

                try {
                  const res = await fetch("/api/rackets/fav", {
                    method: isFavorited ? "DELETE" : "POST",
                    body: JSON.stringify({
                      racketId: racket.racket_id,
                      userId: user.id,
                    }),
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
              }}
            >
              <svg
                className="w-10 h-10"
                fill={
                  clickedRackets.has(racket.racket_id) ? "#ea0e24ff" : "#D1D5DB"
                }
                viewBox="0 0 20 20"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            {/* Racket name */}
            <h1 className="text-5xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {truncate(racket.name || "", 3)}
            </h1>

            {/* Toggle between specs and retailers */}
            {!showRetailers ? (
              // Specs view
              <>
                <SpecItem label="Balance" value={racket.balance || "N/A"} />
                <SpecItem
                  label="Weight"
                  value={racket.weight ? `${racket.weight}g` : "N/A"}
                />
                <SpecItem label="Stiffness" value={racket.stiffness || "N/A"} />
                <SpecItem
                  label="Starting at"
                  value={
                    lowestPrice !== "N/A"
                      ? `$${lowestPrice}`
                      : "Price unavailable"
                  }
                />
                <SpecItem
                  label="Available colors"
                  value={racket.color || "N/A"}
                />

                <button
                  onClick={() => setShowRetailers(true)}
                  className="mt-4 px-6 py-3 bg-[#FFC038] text-white tracking-widest font-semibold rounded-full hover:opacity-90 w-max"
                >
                  View Retailers
                </button>
              </>
            ) : (
              // Retailers view
              <>
                {retailers.length === 0 ? (
                  <div className="mt-4">
                    <p className="text-gray-500 text-xl mb-4">
                      No retailers currently stock this racket.
                    </p>
                    <button
                      onClick={() => setShowRetailers(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 tracking-widest font-semibold rounded-full hover:bg-gray-300 transition-colors"
                    >
                      Back to Specs
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Grid of retailer cards */}
                    <div className="grid grid-cols-1 gap-4 mt-4">
                      {retailers.map((retailer) => (
                        <a
                          key={retailer.retailer_id}
                          href={retailer.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Retailer logo */}
                              <div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                                <img
                                  src={getRetailerLogo(retailer.retailer_name)}
                                  alt={getRetailerDisplayName(
                                    retailer.retailer_name,
                                  )}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    // Fallback to text if logo doesn't exist
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                    (
                                      e.target as HTMLImageElement
                                    ).parentElement!.innerHTML =
                                      `<span class="text-xl font-bold text-gray-600">${getRetailerDisplayName(retailer.retailer_name)[0]}</span>`;
                                  }}
                                />
                              </div>

                              {/* Retailer info */}
                              <div>
                                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {getRetailerDisplayName(
                                    retailer.retailer_name,
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {retailer.website}
                                </p>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-3xl font-bold text-gray-900">
                                ${retailer.price.toFixed(2)}
                              </p>
                              <p className="text-sm text-blue-500 group-hover:text-blue-600 font-semibold">
                                View at store →
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Back button */}
                    <button
                      onClick={() => setShowRetailers(false)}
                      className="mt-4 px-6 py-3 bg-gray-200 text-gray-700 tracking-widest font-semibold rounded-full hover:bg-gray-300 transition-colors"
                    >
                      Back to Specs
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
