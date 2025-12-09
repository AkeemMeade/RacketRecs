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

  const addExampleData = async () => {
    try {
      const res = await fetch("/api/rackets/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturer_id: 1,
          racket_name: "88D Pro",
          series: "Astrox",
          balance: "Head-Heavy",
          weight: "Stiff",
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to add: ${res.status}`);
      }

      await fetchRackets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div>
      <h1>Rackets</h1>
      <button onClick={addExampleData}>Add Yonex Example</button>

      {loading && <p>Loading rackets...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && rackets.length === 0 && <p>No rackets found.</p>}

      {!loading && rackets.length > 0 && (
        <table style={{ borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", padding: "8px" }}>ID</th>
              <th style={{ border: "1px solid black", padding: "8px" }}>
                Name
              </th>
              <th style={{ border: "1px solid black", padding: "8px" }}>
                Series
              </th>
              <th style={{ border: "1px solid black", padding: "8px" }}>
                Balance
              </th>
              <th style={{ border: "1px solid black", padding: "8px" }}>
                Weight
              </th>
              <th style={{ border: "1px solid black", padding: "8px" }}>
                Manufacturer ID
              </th>
            </tr>
          </thead>
          <tbody>
            {rackets.map((racket) => (
              <tr key={racket.racket_id}>
                <td style={{ border: "1px solid black", padding: "8px" }}>
                  {racket.racket_id}
                </td>
                <td style={{ border: "1px solid black", padding: "8px" }}>
                  {racket.name}
                </td>
                <td style={{ border: "1px solid black", padding: "8px" }}>
                  {racket.series}
                </td>
                <td style={{ border: "1px solid black", padding: "8px" }}>
                  {racket.balance}
                </td>
                <td style={{ border: "1px solid black", padding: "8px" }}>
                  {racket.weight}
                </td>
                <td style={{ border: "1px solid black", padding: "8px" }}>
                  {racket.manufacturer_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
