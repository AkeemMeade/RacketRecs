"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { useNavbar } from "./ui/navbar-context";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export function Navbar() {
  const { open } = useNavbar();
  return (
    <>
      {/* Nav bar */}
      <nav className={`${outfit.className} flex justify-between items-center px-8 py-4 bg-transparent transition-all duration-300 z-40`}
>
        <Link className="font-extrabold text-3xl uppercase ml-15" href="/">
          RacketRecs
        </Link>
        <div className="flex items-center gap-8">
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
      <div 
        className="right-0 h-1 bg-[#FFC038] transition-all duration-300 z-40"
        style={{ left: open ? "18rem" : "5rem", top: "60px" }}></div>
    </>
  );
}
