"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { useUser } from "@/lib/UserContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Nav bar */}
      <nav className={`${outfit.className} flex justify-between items-center px-8 py-4 bg-transparent `}>
        <Link className="font-extrabold text-3xl uppercase" href="/">
          RacketRecs
        </Link>
        <div className="flex items-center gap-8">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : user ? (
            <>
              <span className="text-gray-700">{user.email}</span>
              <Link
                href="/profile"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-85"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
              >
                Sign out
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

      {/*Nav bar separator*/}
      <div className="w-full h-1 bg-[#FFC038]"></div>
    </>
  );
}
