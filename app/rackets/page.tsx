"use client";

import { Outfit, Roboto } from "next/font/google";
import Link from "next/link";
import { useState, useEffect } from "react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface Racket {
  racket_id: string;
  name: string;
  series: string;
  balance: string;
  weight: string;
  manufacturer_id: string;
  img_url: string;
}

export default function RacketsPage() {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBalances, setSelectedBalances] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [selectedWeightRanges, setSelectedWeightRanges] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [clickedRackets, setClickedRackets] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRackets();
  }, []);

  useEffect(() => {
    let filtered = rackets;

    // Apply search query filter
    // no query
    if (searchQuery.trim() === "") {
      setFilteredRackets(rackets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = rackets.filter(
        (racket) =>
          racket.name?.toLowerCase().includes(query) ||
          racket.balance?.toLowerCase().includes(query) ||
          racket.series?.toLowerCase().includes(query) ||
          racket.weight?.toLowerCase().includes(query),
      );

      setFilteredRackets(filtered);
    }

    // Apply other filters
  if (selectedBalances.length > 0) {
    filtered = filtered.filter((racket) =>
      selectedBalances.includes(racket.balance)
    );
  }

  if (selectedManufacturers.length > 0) {
    filtered = filtered.filter((racket) =>
      selectedManufacturers.includes(racket.manufacturer_id)
    );
  }

  if (selectedWeightRanges.length > 0) {
    filtered = filtered.filter((racket) =>
      selectedWeightRanges.includes(racket.weight)
    );
  }

  if (selectedSeries.length > 0) {
    filtered = filtered.filter((racket) =>
      selectedSeries.includes(racket.series)
    );
  }

  }, [searchQuery, rackets, selectedBalances, selectedManufacturers, selectedWeightRanges, selectedSeries]);

  const fetchRackets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rackets");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setRackets(data || []);
      setFilteredRackets(data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleFavorite = async (racketId: string) => {
    const newFavorites = new Set(clickedRackets);
    const isFavorited = newFavorites.has(racketId);
  
  // Send to database
  await fetch("/api/rackets/fav", {
    method: isFavorited ? "DELETE" : "POST",
    body: JSON.stringify({ racketId, userId: "current_user_id" }), // Replace with actual user ID
    headers: { "Content-Type": "application/json" },
  });
  
  // Update local state
  if (isFavorited) newFavorites.delete(racketId);
  else newFavorites.add(racketId);
  setClickedRackets(newFavorites);
};

  const thClass = "px-6 py-4 text-left text-sm font-semibold text-white";

   return (
     <>
       {/* gradient */}
       <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

       {/* Main Content */}
      <div></div>
       <div className="mt-10 w-[1650] mx-auto px-4 py-12">
         <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-12">
           <div className="flex justify-between items-center mb-10">
            <h2
               className={`text-3xl font-bold text-gray-800 ${outfit.className}`}
             >
               Browse Rackets
             </h2>

             <button
               className={` 
            ${outfit.className} 
            text-black bg-[#FFC038] 
            rounded-full p-3 w-20 
            hover:opacity-90 
            hover:cursor-pointer 
            hover:outline`}
             >
               Filter
             </button>
           </div>

           {/* Search bar */}
           <div className="mb-8">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <svg
                   className="h-5 w-5 text-blue-400"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                   />
                 </svg>
               </div>
               <input
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search by name, series, balance, manufacturer, or weight..."
                 className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition"
               />
               {searchQuery && (
                 <button
                   onClick={handleClearSearch}
                   className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                   aria-label="Clear search"
                 >
                   <svg
                     className="h-5 w-5"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                   >
                     <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth={2}
                       d="M6 18L18 6M6 6l12 12"
                     />
                   </svg>
                 </button>
               )}
             </div>
             {searchQuery && (
               <p className="mt-2 text-sm text-gray-600">
                 Found {filteredRackets.length} racket
                 {filteredRackets.length !== 1 ? "s" : ""}
               </p>
             )}
           </div>

           {/* Loading State */}
           {loading && (
             <div className="text-center py-20">
               <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
               <p className="mt-4 text-gray-600">Loading rackets...</p>
             </div>
           )}

           {/* Error State */}
           {error && (
             <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
               <p className="text-red-700">Error: {error}</p>
             </div>
           )}

           {/* Empty State */}
           {!loading && filteredRackets.length === 0 && !error && (
             <div className="text-center py-20">
               <p className="text-gray-500 text-lg">
                 {searchQuery
                   ? "No rackets match your search."
                   : "No rackets found."}
               </p>
             </div>
           )}

           {/* Gallery Grid */}
           {!loading && filteredRackets.length > 0 && (
             <div className="grid grid-cols-4 gap-8">
               {filteredRackets.map((racket) => (
                 <div key={racket.racket_id} className="relative">
                   {/* Favorite Button - Outside the Link */}
                   <button
                     onClick={() => {
                       const newFavorites = new Set(clickedRackets);
                       if (newFavorites.has(racket.racket_id)) {
                         newFavorites.delete(racket.racket_id);
                       } else {
                         newFavorites.add(racket.racket_id);
                       }
                       setClickedRackets(newFavorites);
                     }}
                     className="absolute top-3 right-3 z-10 p-1 hover:scale-110 transition-transform"
                   >
                     <svg 
                       className="w-6 h-6"
                       fill={clickedRackets.has(racket.racket_id) ? '#FBBF24' : '#D1D5DB'}
                       viewBox="0 0 20 20"
                     >
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                     </svg>
                   </button>

                   {/* Card Link */}
                   <Link
                     href={`/rackets/${racket.racket_id}`}
                     className="group block"
                   >
                     <div
                       className={`${outfit.className} bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border 
                    border-gray-200 group-hover:border-blue-400`}
                     >
                       <img
                         src={racket.img_url || "/placeholder-racket.png"}
                         alt={racket.name}
                         className="w-full h-48 object-contain mb-4 group-hover:scale-105 transition-transform duration-300"
                       />
                       <h3 className="text-center font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                         {racket.name}
                       </h3>
                     </div>
                   </Link>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
     </>
   );
}
