"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Outfit } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const supabase = createClient();

interface Racket {
  racket_id?: number;
  manufacturer_id?: number;
  name?: string;
  balance?: string;
  stiffness?: string;
  price?: number;
  max_tension?: string;
  availability?: string;
  description?: string;
  color?: string;
  weight?: string;
  img_url?: string;
  summary?: string;
}

export default function RecommendationEngine() {
  const [choice, setChoice] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getRec = async () => {
      const { data: ans } = await supabase
        .from("assessment_response")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const answerF = {
        experience: ans.experience,
        playstyle: ans.playstyle,
        playloc: ans.playloc,
        brand: ans.brand,
        movement: ans.movement,
        event: ans.event,
        strength: ans.strength,
        injury: ans.injury,
        feel: ans.feel,
        budget: ans.budget,
      };

      try {
        const res = await fetch("http://localhost:3001/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answerF),
        });

        if (!res.ok) { setError(true); setLoading(false); return; }

        const rackets: Racket[] = await res.json();

        const racketWithSummaries = await Promise.all(
          rackets.map(async (racket) => {
            try {
              const summaryRes = await fetch("/api/recommend-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [{
                    role: "user",
                    content: `The user has the following profile:
- Experience: ${answerF.experience}
- Playstyle: ${answerF.playstyle}
- Play location: ${answerF.playloc}
- Movement: ${answerF.movement}
- Strength: ${answerF.strength}
- Event: ${answerF.event}
- Injury: ${answerF.injury}
- Feel preference: ${answerF.feel}
- Budget: ${answerF.budget}

The recommended racket is:
- Name: ${racket.name}
- Balance: ${racket.balance}
- Stiffness: ${racket.stiffness}
- Max Tension: ${racket.max_tension}
- Weight: ${racket.weight}
- Price: $${racket.price}

In 2-3 sentences, explain why this racket is a good match for this user. Be specific and concise.`,
                  }],
                }),
              });
              const summaryData = await summaryRes.json();
              return { ...racket, summary: summaryData.reply };
            } catch {
              return { ...racket, summary: "" };
            }
          })
        );

        setChoice(racketWithSummaries);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getRec();
  }, []);

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
          Your Recommendations
        </h1>
        <p className="text-white/70 text-sm mb-8">
          Based on your assessment, here are the rackets best suited to your game.
        </p>

        {loading ? (
          <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md p-12 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Generating your personalized recommendations...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md p-10 text-center">
            <p className="text-slate-500 text-sm mb-4">Could not load recommendations. Make sure the recommendation server is running.</p>
            <Link href="/assessment" className="px-5 py-2 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition">
              Retake Assessment
            </Link>
          </div>
        ) : choice.length === 0 ? (
          <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md p-10 text-center">
            <p className="text-slate-500 text-sm mb-4">No recommendations found. Try retaking the assessment.</p>
            <Link href="/assessment" className="px-5 py-2 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition">
              Retake Assessment
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden">
            {choice.map((racket, index) => (
              <div
                key={index}
                className={`flex flex-col sm:flex-row gap-6 p-8 ${index !== choice.length - 1 ? "border-b-4 border-slate-100" : ""}`}
              >
                {/* Image */}
                {racket.img_url && (
                  <div className="flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-100 rounded-2xl p-4 w-full sm:w-40 h-40">
                    <img
                      src={racket.img_url}
                      alt={racket.name}
                      className="h-full object-contain drop-shadow-md"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="text-xl font-black text-slate-900">{racket.name}</h2>
                    {racket.price && (
                      <span className="text-lg font-bold text-[#FFC038] flex-shrink-0">${racket.price}</span>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                    {racket.balance && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Balance</p>
                        <p className="text-sm font-medium text-slate-800">{racket.balance}</p>
                      </div>
                    )}
                    {racket.stiffness && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Stiffness</p>
                        <p className="text-sm font-medium text-slate-800">{racket.stiffness}</p>
                      </div>
                    )}
                    {racket.weight && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Weight</p>
                        <p className="text-sm font-medium text-slate-800">{racket.weight}</p>
                      </div>
                    )}
                    {racket.color && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Colors</p>
                        <p className="text-sm font-medium text-slate-800">{racket.color}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Summary */}
                  {racket.summary && (
                    <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Why this racket</p>
                      <p className="text-sm text-slate-600 leading-relaxed italic">{racket.summary}</p>
                    </div>
                  )}

                  {/* Link to racket page */}
                  {racket.racket_id && (
                    <Link
                      href={`/rackets/${racket.racket_id}`}
                      className="inline-block mt-4 px-5 py-2 rounded-full bg-[#FFC038] text-white text-xs font-semibold hover:opacity-90 transition"
                    >
                      View Racket →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}