"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "700"] });

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function TemplatePage() {
  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-8">
          Recommendations
        </h1>

        <SectionCard title="Section Title" subtitle="Section subtitle">
          <div className="space-y-3">
            {/* list items go here */}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}