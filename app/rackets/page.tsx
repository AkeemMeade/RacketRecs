"use client";

import { Outfit, Roboto } from "next/font/google";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import TuneIcon from "@mui/icons-material/Tune";
import Checkbox from "@mui/material/Checkbox";
import { GiShuttlecock } from "react-icons/gi";
import { createClient } from "@/lib/supabase/client";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface Racket {
  racket_id: string;
  name: string;
  balance: string;
  weight: string;
  manufacturer_id: number;
  manufacturer: {
    name: string;
  };
  img_url?: string;
}

interface String {
  string_id: string;
  name: string;
  manufacturer_id: number;
  manufacturer: {
    name: string;
  };
  gauge: number;
  feel: string;
  img_url?: string;
}

export default function RacketsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [view, setView] = useState<"rackets" | "strings">("rackets");
  const [strings, setStrings] = useState<String[]>([]);
  const [filteredStrings, setFilteredStrings] = useState<String[]>([]);
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBalances, setSelectedBalances] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    [],
  );
  const [selectedWeightRanges, setSelectedWeightRanges] = useState<string[]>(
    [],
  );
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const indexOfLastRacket = currentPage * itemsPerPage;
  const indexOfFirstRacket = indexOfLastRacket - itemsPerPage;
  const currentRackets = filteredRackets.slice(
    indexOfFirstRacket,
    indexOfLastRacket,
  );
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
          racket.manufacturer?.name?.toLowerCase().includes(query),
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
        selectedManufacturers.includes(racket.manufacturer?.name)
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

  // get rackets from api route
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

  // get strings
  const fetchStrings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/strings");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setStrings(data || []);
      setFilteredStrings(data || [])
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };


  const addToBrowsingHistory = async (racketId: string | number) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("User not logged in. Browsing history not saved.");
      return;
    }

    const { error } = await supabase
      .from("browsing_history")
      .upsert(
        {
          user_id: user.id,
          racket_id: Number(racketId),
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,racket_id",
        }
      );

    if (error) {
      console.error("Failed to save browsing history:", error.message);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // fix unpatched name values by truncating to first 3 words
  const truncate = (name: string, wordCount: number = 4): string => {
    const words = name.split("-");
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1),
    );
    return capitalizedWords.slice(0, wordCount).join(" ");
  };

  return (
    <>

      {/* Main Content */}
      <div className="-mt-15 max-w-[1250px] mx-auto px-4 py-12">

        <h1
          className={`text-4xl font-bold tracking-tight text-white drop-shadow-md ${outfit.className} mb-8`}>
          {view === "rackets" ? "Browse Rackets" : "Browse Strings"}
        </h1>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-12">
          <div className="flex justify-between items-center mb-10">
            <div className="relative">

            </div>
          </div>
          
          {/* Search bar */}
          <div className="mb-8 flex gap-5 -mt-10">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mb-9">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, balance or manufacturer"
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
            {/* end of Search bar */}

            {/* Change View  */}
            <button
            onClick={() => {
              if (view === "rackets") {
                setView("strings");

                if (strings.length === 0) fetchStrings();
              } else {
                setView("rackets");
              }
            }}
            className={`${outfit.className} 
            text-black bg-[#FFC038] 
            rounded-full p-3 w-auto 
            hover:opacity-90 
            hover:cursor-pointer 
            hover:outline mb-10 text-white shadow-20`}>
            {view === "rackets" ? "Browse Strings" : "Browse Rackets"}
          </button>


            {/* Filter button */}
            <div className={`relative ${outfit.className}`}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={` 
            ${outfit.className} 
            text-white bg-[#FFC038] 
            rounded-full p-3 w-20 
            hover:opacity-90 
            hover:cursor-pointer 
            hover:outline`}
              >
                <TuneIcon className="h-5 w-5" />
              </button>

              {showFilters && (
                <div
                  className={`absolute left-43 -mt-34 w-64 bg-white rounded-lg shadow-lg p-4 z-20`}
                >
                  <h3 className={`font-bold text-black ${outfit.className}`}>
                    Balance
                  </h3>

                  <div className="flex flex-col text-black ">
                    {["Head Heavy", "Head Light", "Even"].map((balance) => (
                      <label key={balance}>
                        <Checkbox sx={{
                          '&.Mui-checked': {
                            color: '#FFC038'
                          }
                        }}
                          checked={selectedBalances.includes(balance)}
                          onChange={() => {
                            if (selectedBalances.includes(balance)) {
                              setSelectedBalances(
                                selectedBalances.filter((b) => b !== balance),
                              );
                            } else {
                              setSelectedBalances([
                                ...selectedBalances,
                                balance,
                              ]);
                            }
                          }}
                        />
                        {balance}
                      </label>
                    ))}
                  </div>

                  <h3 className={`font-bold text-black ${outfit.className}`}>Manufacturer</h3>

                  <div className="flex flex-col text-black">
                    {["Yonex", "Victor", "Li-Ning", "Hundred", "Ashaway", "Apacs", "Technist", "Gosen", "Jnice", "Mizuno"].map(
                      (manufacturer) => (
                        <label key={manufacturer}>
                          <Checkbox sx={{
                            '&.Mui-checked': {
                              color: '#FFC038'
                            }
                          }}
                            checked={selectedManufacturers.includes(
                              manufacturer,
                            )}
                            onChange={() => {
                              if (
                                selectedManufacturers.includes(manufacturer)
                              ) {
                                setSelectedManufacturers(
                                  selectedManufacturers.filter(
                                    (m) => m !== manufacturer,
                                  ),
                                );
                              } else {
                                setSelectedManufacturers([
                                  ...selectedManufacturers,
                                  manufacturer,
                                ]);
                              }
                            }}
                          />
                          {manufacturer}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/*end of filter button */}


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
          {!loading && (view === "rackets" ? filteredRackets : filteredStrings).length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-8">
                {(view === "rackets" ? currentRackets : filteredStrings.slice(indexOfFirstRacket, indexOfLastRacket)).map((item) => (
                  <Link
                    key={view === "rackets" ? (item as Racket).racket_id : (item as String).string_id}
                    href={view === "rackets" ? `/rackets/${(item as Racket).racket_id}` : `/strings/${(item as String).string_id}`}
                    className="group"
                    onClick={() => view === "rackets" && addToBrowsingHistory((item as Racket).racket_id)}
                  >
                    <div className={`${outfit.className} bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 group-hover:border-blue-400 h-72 flex flex-col`}>
                      <img
                        src={item.img_url || "/placeholder-racket.png"}
                        alt={item.name}
                        className="w-full h-48 object-contain mb-4 group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
                      />
                      <h3 className="tracking-tightest text-center font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-auto">
                        {item.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pages */}
              <div className={` ${outfit.className} flex justify-center items-center gap-4 mt-8`}>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-full ${currentPage === 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#FFC038] text-black hover:bg-[#FFB800] hover:cursor-pointer"
                    }`}
                >
                  ← Previous
                </button>

                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-full ${currentPage === totalPages
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#FFC038] text-black hover:bg-[#FFB800] hover:cursor-pointer"
                    }`}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
