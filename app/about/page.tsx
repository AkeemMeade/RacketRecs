"use client";

import { Outfit, DM_Serif_Display } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" });

const team = [
  {
    name: "Nickolas Toch",
    bio: "",
    initials: "NT",
  },
  {
    name: "Akeem Meade",
    bio: "",
    initials: "AM",
  },
  {
    name: "Christopher Nguyen",
    bio: "",
    initials: "CN",
  },
  {
    name: "Jason Asinobi",
    bio: "",
    initials: "JA",
  },
  {
    name: "Joshua Mendoza",
    bio: "",
    initials: "JM",
  },
];

export default function AboutPage() {
  return (
    <main className={`${outfit.className} min-h-screen`}>

      {/* Hero — sits on global blue gradient */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-20">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/70 mb-4">
          About RacketRecs
        </p>
        <h1 className={`${dmSerif.className} text-6xl text-white leading-tight mb-6 drop-shadow-sm`}>
          Find the racket that fits <em>your</em> game.
        </h1>
        <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
          RacketRecs is a badminton racket recommendation platform built for players who want a smarter way to find their next racket — one that actually matches how they play.
        </p>
      </section>

      {/* White content slides up */}
      <div className="bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">

        {/* What is RacketRecs */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">
                What is RacketRecs
              </p>
              <h2 className={`${dmSerif.className} text-4xl text-slate-900 mb-5`}>
                More than just a catalogue.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Most players pick a racket based on brand loyalty or what their coach uses. RacketRecs takes a different approach — we ask about your playing style, experience, physical strengths, and budget, then match you with rackets that are actually suited to you.
              </p>
              <p className="text-slate-500 leading-relaxed">
                Whether you're a beginner trying to find your first serious racket or an advanced player looking to fine-tune your equipment, RacketRecs gives you a starting point grounded in real data.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Player Assessment", desc: "Answer 10 questions about your game and get personalized recommendations." },
                { label: "Racket Catalogue", desc: "Browse hundreds of rackets with detailed specs, pricing, and retailer links." },
                { label: "Community", desc: "Follow other players, share posts, and see what equipment others are using." },
                { label: "Marketplace", desc: "Buy and sell rackets directly with other players in the community." },
              ].map((item) => (
                <div key={item.label} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-[#FFC038] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-slate-100">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">
            Who it's for
          </p>
          <h2 className={`${dmSerif.className} text-4xl text-slate-900 mb-10`}>
            Built for every level of player.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                level: "Beginner",
                desc: "New to badminton and overwhelmed by the options. We help you find a forgiving, affordable racket to grow with.",
                color: "bg-blue-50 border-blue-100",
                tag: "bg-blue-100 text-blue-600",
              },
              {
                level: "Intermediate",
                desc: "You know your game but aren't sure which racket will help you take the next step. We narrow it down.",
                color: "bg-amber-50 border-amber-100",
                tag: "bg-amber-100 text-amber-600",
              },
              {
                level: "Advanced",
                desc: "You have specific needs — stiffness, balance, weight. We match you with rackets that meet your exact criteria.",
                color: "bg-emerald-50 border-emerald-100",
                tag: "bg-emerald-100 text-emerald-600",
              },
            ].map((item) => (
              <div key={item.level} className={`rounded-2xl border p-6 ${item.color}`}>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${item.tag}`}>
                  {item.level}
                </span>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-slate-100">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-3">
            The team
          </p>
          <h2 className={`${dmSerif.className} text-4xl text-slate-900 mb-10`}>
            Made by badminton players, for badminton players (one of them).
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col gap-3">
                <div className="w-14 h-14 rounded-full bg-[#FFC038] flex items-center justify-center text-white text-lg font-bold">
                  {member.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  {/*<p className="text-xs text-[#FFC038] font-medium mt-0.5">{member.role}</p>*/}
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-3xl bg-slate-900 px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className={`${dmSerif.className} text-3xl text-white mb-2`}>
                Ready to find your racket?
              </h2>
              <p className="text-slate-400 text-sm">
                Take the assessment and get your personalized recommendations in under 2 minutes.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/assessment"
                className="px-6 py-3 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Take Assessment
              </Link>
              <Link
                href="/rackets"
                className="px-6 py-3 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition"
              >
                Browse Rackets
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}