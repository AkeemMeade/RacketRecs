"use client";

import { useEffect, useMemo, useState } from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
});

type RetailerPrice = {
  price: number | string | null;
};

type ApiRacket = {
  racket_id: number;
  name: string | null;
  stiffness: string | null;
  balance: string | null;
  weight: string | null;
  img_url: string | null;
  manufacturer_id: number | null;
  manufacturer?:
    | {
        manufacturer_id?: number | null;
        name?: string | null;
      }
    | {
        manufacturer_id?: number | null;
        name?: string | null;
      }[]
    | null;
  racket_retailer?: RetailerPrice[] | null;
};

type PriceRange = {
  min: number;
  max: number;
};

type ComparisonRacket = {
  id: number;
  name: string;
  brand: string;
  weight: string;
  balance: string;
  stiffness: string;
  skillLevel: string;
  priceRange: PriceRange | null;
};

function formatRacketName(name: string | null): string {
  if (!name) return "Unnamed Racket";

  const ignoreWords = ["badminton", "racket", "unstrung"];

  const words = name
    .replace(/[-_/]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !ignoreWords.includes(word.toLowerCase()))
    .slice(0, 4);

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getPriceRange(
  retailerEntries: RetailerPrice[] | null | undefined
): PriceRange | null {
  if (!retailerEntries || retailerEntries.length === 0) return null;

  const prices = retailerEntries
    .map((entry) => {
      if (entry?.price === null || entry?.price === undefined) return null;
      const parsed = Number(entry.price);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((price): price is number => price !== null);

  if (prices.length === 0) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatPriceRange(priceRange: PriceRange | null): string {
  if (!priceRange) return "Price unavailable";

  if (priceRange.min === priceRange.max) {
    return formatCurrency(priceRange.min);
  }

  return `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`;
}

const MAX_COMPARE = 2;

export default function ComparisonPage() {
  const [query, setQuery] = useState("");
  const [selectedRackets, setSelectedRackets] = useState<ComparisonRacket[]>([]);
  const [allRackets, setAllRackets] = useState<ComparisonRacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRackets = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/rackets");

        if (!response.ok) {
          throw new Error(`Failed to fetch rackets: ${response.status}`);
        }

        const data: ApiRacket[] = await response.json();

        const normalized: ComparisonRacket[] = (data ?? []).map((racket) => {
          const manufacturerData = Array.isArray(racket.manufacturer)
            ? racket.manufacturer[0]
            : racket.manufacturer;

          return {
            id: racket.racket_id,
            name: racket.name ?? "Unnamed Racket",
            brand: manufacturerData?.name ?? "Unknown",
            weight: racket.weight ?? "N/A",
            balance: racket.balance ?? "N/A",
            stiffness: racket.stiffness ?? "N/A",
            skillLevel: "N/A",
            priceRange: getPriceRange(racket.racket_retailer),
          };
        });

        setAllRackets(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchRackets();
  }, []);

  const filteredRackets = useMemo(() => {
    const lower = query.toLowerCase().trim();

    if (!lower) return allRackets;

    return allRackets.filter(
      (racket) =>
        formatRacketName(racket.name).toLowerCase().includes(lower) ||
        racket.brand.toLowerCase().includes(lower) ||
        racket.balance.toLowerCase().includes(lower) ||
        racket.stiffness.toLowerCase().includes(lower)
    );
  }, [query, allRackets]);

  const addToCompare = (racket: ComparisonRacket) => {
    const alreadySelected = selectedRackets.some((r) => r.id === racket.id);
    if (alreadySelected) return;
    if (selectedRackets.length >= MAX_COMPARE) return;

    setSelectedRackets((prev) => [...prev, racket]);
  };

  const removeFromCompare = (id: number) => {
    setSelectedRackets((prev) => prev.filter((racket) => racket.id !== id));
  };

  const comparisonFields: { label: string; key: keyof ComparisonRacket }[] = [
    { label: "Brand", key: "brand" },
    { label: "Weight", key: "weight" },
    { label: "Balance", key: "balance" },
    { label: "Stiffness", key: "stiffness" },
    { label: "Skill Level", key: "skillLevel" },
  ];

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Comparison Tool
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/90">
            Compare badminton rackets side by side based on important specs like
            weight, balance, stiffness, and skill level.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-slate-800">Select Rackets</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add up to {MAX_COMPARE} racket{MAX_COMPARE > 1 ? "s" : ""} to compare.
            </p>

            <input
              type="text"
              placeholder="Search racket or brand..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />

            <div className="mt-6 max-h-[560px] space-y-3 overflow-y-auto pr-2">
              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
                  Loading rackets...
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
                  {error}
                </div>
              )}

              {!loading && !error && filteredRackets.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
                  No rackets found.
                </div>
              )}

              {!loading &&
                !error &&
                filteredRackets.map((racket) => {
                  const alreadySelected = selectedRackets.some(
                    (r) => r.id === racket.id
                  );
                  const compareFull = selectedRackets.length >= MAX_COMPARE;

                  return (
                    <div
                      key={racket.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {formatRacketName(racket.name)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {racket.brand} • {racket.weight} • {racket.balance}
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            {formatPriceRange(racket.priceRange)}
                          </p>
                        </div>

                        <button
                          onClick={() => addToCompare(racket)}
                          disabled={alreadySelected || compareFull}
                          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {alreadySelected
                            ? "Added"
                            : compareFull
                              ? "Limit Reached"
                              : "Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-3xl bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                Selected Rackets
              </h2>
              <span className="text-sm text-slate-600">
                {selectedRackets.length}/{MAX_COMPARE} selected
              </span>
            </div>

            {selectedRackets.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                No rackets selected yet.
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {selectedRackets.map((racket) => (
                    <div
                      key={racket.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {formatRacketName(racket.name)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {racket.brand}
                          </p>
                          <p className="mt-3 text-sm font-medium text-slate-700">
                            {formatPriceRange(racket.priceRange)}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCompare(racket.id)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRackets.length >= 2 && (
                  <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                            Metric
                          </th>
                          {selectedRackets.map((racket) => (
                            <th
                              key={racket.id}
                              className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700"
                            >
                              {formatRacketName(racket.name)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFields.map((field) => (
                          <tr key={field.label} className="odd:bg-slate-50 even:bg-white">
                            <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-600">
                              {field.label}
                            </td>
                            {selectedRackets.map((racket) => (
                              <td
                                key={`${racket.id}-${field.key}`}
                                className="border-b border-slate-200 px-4 py-3 text-slate-800"
                              >
                                {String(racket[field.key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="odd:bg-slate-50 even:bg-white">
                          <td className="px-4 py-3 font-medium text-slate-600">
                            Price
                          </td>
                          {selectedRackets.map((racket) => (
                            <td
                              key={`${racket.id}-price`}
                              className="px-4 py-3 text-slate-800"
                            >
                              {formatPriceRange(racket.priceRange)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}