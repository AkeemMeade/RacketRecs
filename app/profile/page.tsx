"use client";

import React from "react";
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

export default function ProfilePage() {
  return (
    <main className={`${outfit.className} min-h-screen`}>

      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <div className="mx-auto w-full max-w-6xl px-4 py-10"></div>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            My Profile
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Your account dashboard will appear here once authentication and
            user data are connected.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <SectionCard
              title="Personal Information"
              subtitle="User details will populate here."
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">
                  No user data loaded.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Favorites"
              subtitle="Saved rackets will appear here."
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">
                  No favorites yet.
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard
              title="Player Assessment"
              subtitle="Assessment results will display here."
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">
                  Assessment data not available.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Recommendations"
              subtitle="Personalized racket recommendations will appear here."
            >
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">
                  No recommendations yet.
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}