"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Outfit, DM_Sans } from "next/font/google";
import { useRouter } from "next/navigation";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const supabase = createClient();

interface StringRec {
  string_id?: number;
  manufacturer_id?: number;
  name?: string;
  gauge?: number;
  feel?: string;
  img_url?: string;
}

const labels = ["🏆 Top Choice", "🥈 Second Best", "🥉 Third Best"];

export default function StringRecommendation() {
  const [choice, setChoice] = useState<StringRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getRec = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ans } = await supabase
        .from("assessment_response")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!ans) { setError(true); setLoading(false); return; }

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
        const res = await fetch("http://localhost:3001/api/stringrec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answerF),
        });

        if (!res.ok) { setError(true); setLoading(false); return; }

        const rec = await res.json();
        setChoice(rec);
        setLoading(false);
      } catch (err) {
        console.error("Recommendation fetch failed:", err);
        setLoading(false);
      }
    };

    getRec();
  }, []);

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="max-w-4xl mx-auto px-4 py-10">

        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-2">
          String Recommendations
        </h1>
        <p className="text-white/70 text-sm mb-8">
          Based on your assessment, here are the strings best suited to your game.
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
          <>
            <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md overflow-hidden mb-6">
              {choice.map((item, index) => (
                <Link
                  key={index}
                  href={`/strings/${item.string_id}`}
                  className={`flex flex-col sm:flex-row gap-6 p-8 ${index !== choice.length - 1 ? "border-b-4 border-slate-100" : ""}`}
                >
                  {/* Image */}
                  {item.img_url && (
                    <div className="flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-100 rounded-2xl p-4 w-full sm:w-44 h-44">
                      <img
                        src={item.img_url}
                        alt={item.name}
                        className="h-full object-contain drop-shadow-md"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-black">{labels[index]}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className={`${dmSans.className} text-xl font-black text-slate-900`}>{item.name}</h2>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                      {item.gauge && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Gauge</p>
                          <p className="text-sm font-medium text-slate-800">{item.gauge}mm</p>
                        </div>
                      )}
                      {item.feel && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Feel</p>
                          <p className="text-sm font-medium text-slate-800">{item.feel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Back to racket recommendations */}
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/recommendation")}
                className="px-8 py-3 rounded-full bg-[#FFC038] text-white font-semibold text-sm hover:opacity-90 transition cursor-pointer"
              >
                See Recommended Rackets
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}