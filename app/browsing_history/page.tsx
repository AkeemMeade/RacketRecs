"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

interface BrowsingHistoryItem {
  id: number;
  viewed_at: string;
  racket_id: string;
  rackets: {
    name: string;
    img_url: string;
    manufacturer?: {
      name: string;
    };
  };
}

export default function BrowsingHistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<BrowsingHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        // Replace this later with your actual API route
        const res = await fetch(`/api/history?userId=${user.id}`);
        if (!res.ok) return;

        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Failed to load browsing history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user]);

  const truncate = (name: string, wordCount = 4): string => {
    const words = name.split("-");
    return words
      .slice(0, wordCount)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatViewedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />

      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            Browsing History
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Revisit rackets you previously viewed and jump back into your search.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-1">
            <SectionCard
              title="History Overview"
              subtitle="A quick summary of your recent activity."
            >
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">Total viewed rackets</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {history.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">Latest activity</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {history.length > 0
                      ? formatViewedTime(history[0].viewed_at)
                      : "No browsing activity yet."}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Actions"
              subtitle="Manage your browsing history."
            >
              <div className="space-y-3">
                <button
                  className="w-full rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
                  onClick={() => {
                    // Hook this up later
                    console.log("Clear history clicked");
                  }}
                >
                  Clear Browsing History
                </button>

                <Link
                  href="/rackets"
                  className="block w-full rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Browse More Rackets
                </Link>
              </div>
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard
              title="Recently Viewed"
              subtitle={`${history.length} racket${history.length !== 1 ? "s" : ""} in your history`}
            >
              {loadingHistory ? (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
                </div>
              ) : !user ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">
                    Sign in to view your browsing history.
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">
                    No browsing history yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <Link
                      key={item.id}
                      href={`/rackets/${item.racket_id}`}
                      className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100 transition hover:bg-blue-50 hover:ring-blue-400"
                    >
                      <img
                        src={item.rackets?.img_url || "/placeholder-racket.png"}
                        alt={item.rackets?.name || "Racket image"}
                        className="h-14 w-14 shrink-0 object-contain"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {truncate(item.rackets?.name || "", 4)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.rackets?.manufacturer?.name || "Unknown Brand"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Viewed: {formatViewedTime(item.viewed_at)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          View Again
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}