"use client";
import { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRackets();
  }, []);

  const fetchRackets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rackets");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setRackets(data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Rackets</h2>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              <p className="mt-4 text-gray-600">Loading rackets...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">Error: {error}</p>
            </div>
          )}

          {!loading && rackets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No rackets found.</p>
            </div>
          )}

          {!loading && rackets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-cyan-500 text-white">

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Series
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Weight
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rackets.map((racket, index) => (
                    <tr
                      key={racket.racket_id}
                      className={`${
                        index % 2 === 0 ? "bg-cyan-50" : "bg-white"
                      } hover:bg-cyan-100 transition`}
>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {racket.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {racket.series}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {racket.balance}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {racket.weight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
