"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export function Navbar() {
  return (
    <>
      {/* Nav bar */}
      <nav className={`${outfit.className} flex justify-between items-center px-8 py-4 bg-transparent`}>
        <Link className="font-extrabold text-3xl uppercase" href="/">
          RacketRecs
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/about">about</Link>
          <Link href="/contact">contact</Link>
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-85"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2 border-2 border-white text-white rounded-full hover:bg-white hover:text-primary-foreground transition-colors"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/*Nav bar separator*/}
      <div className="w-full h-1 bg-[#FFC038]"></div>
    </>
  );
}
