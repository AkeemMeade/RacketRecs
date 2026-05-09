"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { DM_Sans } from "next/font/google";
import { Outfit } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const outfit = Outfit({ subsets: ["latin"], weight: "400" });

const supabase = createClient();

export default function StringDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [string, setString] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchString() {
      const { data } = await supabase
        .from("string")
        .select(`
          *,
          manufacturer:manufacturer_id (
            name
          )
        `)
        .eq("string_id", id)
        .single();
      setString(data);
      setLoading(false);
    }
    fetchString();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-[#FFC038] rounded-full animate-spin" />
      </div>
    );
  }

  if (!string) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-lg font-semibold">String not found.</p>
      </div>
    );
  }

  const SpecItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <span className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-blue-400`}>
        {label}
      </span>
      <span className={`${dmSans.className} text-base font-medium text-black`}>
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div className="container mx-auto py-14 px-4 max-w-5xl">
        <div className="flex flex-col -mt-10">
          <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-white/90 shadow-[0_4px_32px_rgba(56,130,200,0.08)] overflow-hidden flex h-[500px] -mt-10">

            {/* Image panel */}
            <div className="w-5/12 bg-gradient-to-br from-slate-50 to-sky-200 border-r border-sky-100 flex items-center justify-center p-10 relative">
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3/5 h-3 rounded-full bg-sky-200/40 blur-md" />
              <img
                src={string.img_url || "/placeholder-racket.png"}
                alt={string.name}
                className="w-72 h-72 object-contain drop-shadow-[0_8px_24px_rgba(56,130,200,0.18)] rounded-3xl"
              />
            </div>

            {/* Content panel */}
            <div className="flex-1 flex flex-col px-10 py-9 overflow-y-auto">

              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <span className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-sky-600 bg-sky-100 border border-sky-200 px-3 py-1 rounded-full`}>
                  String
                </span>
              </div>

              <h1 className={`${outfit.className} text-4xl text-black tracking-tight leading-tight mb-1`}>
                {string.name}
              </h1>
              <div className="border-t border-sky-100 mb-6" />

              {/* Specs */}
              <div className="mb-3">
                <h2 className={`${dmSans.className} text-xs font-semibold tracking-widest uppercase text-sky-600`}>Specs</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-4">
                {string.manufacturer?.name && (
                  <SpecItem label="Manufacturer" value={string.manufacturer.name} />
                )}
                {string.gauge && (
                  <SpecItem label="Gauge" value={`${string.gauge}`} />
                )}
                {string.feel && (
                  <SpecItem label="Feel" value={string.feel} />
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}