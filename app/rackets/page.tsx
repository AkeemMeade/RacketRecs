"use client";

import { Outfit, Roboto } from "next/font/google";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/UserContext";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface Racket {
  racket_id: string;
  name: string;
  balance: string;
  weight: string;
  manufacturer_id: string;
  img_url: string;
}

export default function RacketsPage() {
  const { user, loading: userLoading } = useUser();
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBalances, setSelectedBalances] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([],);
  const [selectedWeightRanges, setSelectedWeightRanges] = useState<string[]>([],);
  const [showFilters, setShowFilters] = useState(false);
  const [clickedRackets, setClickedRackets] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const indexOfLastRacket = currentPage * itemsPerPage;
  const indexOfFirstRacket = indexOfLastRacket - itemsPerPage;
  const currentRackets = filteredRackets.slice(indexOfFirstRacket, indexOfLastRacket);
  const totalPages = Math.ceil(filteredRackets.length / itemsPerPage);

  useEffect(() => {
    fetchRackets();
  }, []);

  useEffect(() => {
    let filtered = rackets;

    // Apply search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (racket) =>
          racket.name?.toLowerCase().includes(query) ||
          racket.balance?.toLowerCase().includes(query) ||
          racket.weight?.toLowerCase().includes(query) ||
          racket.manufacturer_id?.toLowerCase().includes(query),
      );
    }

    // Apply other filters
    if (selectedBalances.length > 0) {
      filtered = filtered.filter((racket) =>
        selectedBalances.includes(racket.balance),
      );
    }

    if (selectedManufacturers.length > 0) {
      filtered = filtered.filter((racket) =>
        selectedManufacturers.includes(racket.manufacturer_id),
      );
    }

    if (selectedWeightRanges.length > 0) {
      filtered = filtered.filter((racket) =>
        selectedWeightRanges.includes(racket.weight),
      );
    }

    setFilteredRackets(filtered);
  }, [
    searchQuery,
    rackets,
    selectedBalances,
    selectedManufacturers,
    selectedWeightRanges,
  ]);

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

  // fix unpatched name values by truncating to first 3 words
  const truncate = (name: string, wordCount: number = 4): string => {
    const words = name.split("-");
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.slice(0, wordCount).join(" ");
  };

  // const thClass = "px-6 py-4 text-left text-sm font-semibold text-white";


  // console.log("Current rackets:", currentRackets);
  // console.log("First racket img_url:", currentRackets[0]?.img_url);

  return (
    <>
      {/* gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

      {/* Main Content */}
      <div className="mt-10 max-w-[1650px] mx-auto px-4 py-12">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-12">
          <div className="flex justify-between items-center mb-10">
            <h2
              className={`text-3xl font-bold text-gray-800 ${outfit.className}`}
            >
              Browse Rackets
            </h2>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={` 
            ${outfit.className} 
            text-black bg-[#FFC038] 
            rounded-full p-3 w-20 
            hover:opacity-90 
            hover:cursor-pointer 
            hover:outline`}
            >
              <TuneIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, balance, manufacturer, or weight..."
                className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                  aria-label="Clear search"
                >
                  <ClearIcon className="h-5 w-5" />
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
      <>
      <div className="grid grid-cols-4 gap-8">
      {currentRackets.map((racket) => (
      <div key={racket.racket_id} className="relative">

      {/* Favorite Button */}
      <button
      onClick={async () => {
      if (!user) {
      alert("Please sign in to add favorites");
      return;
      }

      const isFavorited = clickedRackets.has(racket.racket_id);

      try {
      const response = await fetch("/api/rackets/fav", {
      method: isFavorited ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        racketId: racket.racket_id,
        userId: user.id,
      }),
      });

      if (!response.ok) throw new Error("Failed to update favorite");

      const newFavorites = new Set(clickedRackets);
      if (isFavorited) {
      newFavorites.delete(racket.racket_id);
      } else {
      newFavorites.add(racket.racket_id);
      }
      setClickedRackets(newFavorites);
      } catch (err) {
      console.error("Error updating favorite:", err);
      alert("Failed to update favorite. Please try again.");
      }
      }}
      className="absolute top-3 right-3 z-10 p-1 hover:scale-110 transition-transform"
      >
      <svg
      className="w-6 h-6"
      fill={clickedRackets.has(racket.racket_id) ? "#FBBF24" : "#D1D5DB"}
      viewBox="0 0 20 20"
      >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
      {truncate(racket.name || "", 3)}
      </h3>
      </div>
      </Link>

      </div>
      ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
      <button
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className={`px-4 py-2 rounded-full ${
      currentPage === 1
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-[#FFC038] text-black hover:bg-[#FFB800] hover:cursor-pointer"
      }`}
      >
      Previous
      </button>

      <span className="text-gray-700">
      Page {currentPage} of {totalPages}
      </span>

      <button
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
      className={`px-4 py-2 rounded-full ${
      currentPage === totalPages
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-[#FFC038] text-black hover:bg-[#FFB800] hover:cursor-pointer"
      }`}
      >
      Next
      </button>
      </div>
      </>
      )}
        </div>
      </div>
    </>
  );
}