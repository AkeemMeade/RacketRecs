"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

interface Listing {
  id: string;
  racket_name: string;
  brand: string;
  price: number;
  condition: string;
  status: string;
  image_url: string | null;
  location: string | null;
  created_at: string;
}

export function MarketplaceTab({ userId }: { userId: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("id, racket_name, brand, price, condition, status, image_url, location, created_at")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      setListings(data || []);
      setLoading(false);
    }
    fetchListings();
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Listings</h2>
          <p className="mt-1 text-sm text-slate-500">{listings.length} listing{listings.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/sell_rackets"
          className="px-4 py-2 rounded-full bg-[#FFC038] text-white text-xs font-semibold hover:opacity-90 transition"
        >
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
          <p className="text-sm text-slate-500 mb-3">No listings yet.</p>
          <Link
            href="/sell_rackets"
            className="px-4 py-2 rounded-full bg-[#FFC038] text-white text-xs font-semibold hover:opacity-90 transition"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 py-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.racket_name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-xs text-slate-400">No img</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{listing.racket_name}</p>
                <p className="text-xs text-slate-400">{listing.brand} · {listing.condition}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-[#FFC038]">${listing.price}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  listing.status === "Sold"
                    ? "bg-red-100 text-red-600"
                    : listing.status === "Pending"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-green-100 text-green-600"
                }`}>
                  {listing.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}