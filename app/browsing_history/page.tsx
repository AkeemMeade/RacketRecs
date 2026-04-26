"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

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
          {subtitle && (
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          )}
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
  racket_id: number | string;
  racket: {
    racket_id: number | string;
    name: string | null;
    img_url: string | null;
    manufacturer_id: number | null;
  } | null;
}
export default function BrowsingHistoryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [history, setHistory] = useState<BrowsingHistoryItem[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Failed to get user:", error.message);
        setUserId(null);
      } else {
        setUserId(user?.id ?? null);
      }

      setLoadingUser(false);
    };

    getUser();
  }, [supabase]);

  useEffect(() => {
    if (loadingUser) return;

    if (!userId) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    fetchHistory(userId);
  }, [loadingUser, userId]);

const fetchHistory = async (currentUserId: string) => {
  setLoadingHistory(true);

  const { data, error } = await supabase
    .from("browsing_history")
    .select(`
      id,
      racket_id,
      viewed_at,
      racket:racket_id (
        racket_id,
        name,
        img_url,
        manufacturer_id
      )
    `)
    .eq("user_id", currentUserId)
    .order("viewed_at", { ascending: false });

  if (error) {
    console.error("Failed to load browsing history:", error.message);
    setHistory([]);
  } else {
    setHistory((data ?? []) as BrowsingHistoryItem[]);
  }

  setLoadingHistory(false);
};

  const clearHistory = async () => {
    if (!userId) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear your browsing history?"
    );

    if (!confirmed) return;

    setClearing(true);

    const { error } = await supabase
      .from("browsing_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to clear browsing history:", error.message);
      alert("Failed to clear browsing history.");
    } else {
      setHistory([]);
    }

    setClearing(false);
  };

  const formatName = (name: string | null, wordCount = 4): string => {
    if (!name) return "Unnamed Racket";

    const words = name.includes("-") ? name.split("-") : name.split(" ");

    return words
      .filter(Boolean)
      .slice(0, wordCount)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatViewedTime = (timestamp: string) => {
    const date = new Date(timestamp);

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isLoading = loadingUser || loadingHistory;

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />

      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            Browsing History
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Revisit rackets you previously viewed and jump back into your search.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <SectionCard
              title="History Overview"
              subtitle="A quick summary of your recent activity."
            >
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">
                    Total viewed rackets
                  </p>
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
                  className="w-full rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={clearHistory}
                  disabled={!userId || history.length === 0 || clearing}
                >
                  {clearing ? "Clearing..." : "Clear Browsing History"}
                </button>

                <Link
                  href="/comparison"
                  className="block w-full rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Browse More Rackets
                </Link>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <SectionCard
              title="Recently Viewed"
              subtitle={`${history.length} racket${
                history.length !== 1 ? "s" : ""
              } in your history`}
            >
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
                </div>
              ) : !userId ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">
                    Sign in to view your browsing history.
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                  <p className="text-sm text-slate-500">
                    No browsing history yet. Try viewing rackets from the
                    comparison page.
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
                        src={
                          item.racket?.img_url || "/placeholder-racket.png"
                        }
                        alt={item.racket?.name || "Racket image"}
                        className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain p-2 ring-1 ring-slate-100"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {formatName(item.racket?.name)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.racket?.manufacturer_id
                            ? `Manufacturer #${item.racket.manufacturer_id}`
                            : "Unknown Manufacturer"}
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