"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { useNavbar } from "./ui/navbar-context";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const supabase = createClient();

export function Navbar() {
  const { open, isDark } = useNavbar();
  const { user, loading } = useUser();
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [profile, setProfile] = useState<{ username: string } | null>(null);

  useEffect(() => {
  if (!user) return;
  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user!.id)
      .single();
    setProfile(data);
  }
  fetchProfile();
}, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
        setVisible(true);
      } else {
        setVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <>
      <div
        className={`sticky top-0 z-40 transition-all duration-300 ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Nav bar */}
        <nav
          className={`${outfit.className} flex justify-between items-center px-8 py-4 ${isDark ? "bg-slate-900/80" : "bg-blue-400/80"} backdrop-blur-md`}
        >
          <div className="flex items-center gap-8">
          <Link
            className="font-extrabold text-3xl uppercase ml-15 drop-shadow-sm"
            href="/"
          >
            RacketRecs
          </Link>

          <Link
            className="font-extrabold text-sm uppercase drop-shadow-sm tracking-wide"
            href="/"
          >
            about
          </Link>

          <Link
            className="font-extrabold text-sm uppercase drop-shadow-sm tracking-wide"
            href="/rackets"
          >
            Browse
          </Link>

          <Link
            className="font-extrabold text-sm uppercase drop-shadow-sm tracking-wide"
            href="/"
          >
            Market
          </Link>
          </div>
          <div className="flex items-center gap-8">
            {user ? (
              <>
                <span className="font-semibold text-white">{profile?.username || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2 border-2 border-white text-white rounded-full drop-shadow-sm hover:bg-white hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>

        <div className="h-1 bg-[#FFC038]" />
      </div>
    </>
  );
}
