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
                 <Link
                   key={racket.racket_id}
                   href={`/rackets/${racket.racket_id}`}
                   className="group"
                 >
                   <div
                     className={`${outfit.className} bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border 
                  border-gray-200 group-hover:border-blue-400`}
                   >
                     <img
                       src={racket.image_url || "/placeholder-racket.png"}
                       alt={racket.name}
                       className="w-full h-48 object-contain mb-4 group-hover:scale-105 transition-transform duration-300"
                     />
                     <h3 className="text-center font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                       {racket.name}
                     </h3>
                   </div>
                 </Link>
               ))}
             </div>
           )}
         </div>
       </div>
     </>
   );
}
