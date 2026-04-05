"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import { useNavbar } from "./ui/navbar-context";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

  
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const supabase = createClient();

export function Navbar() {
  const { open } = useNavbar();
  const { user, loading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };


  return (
    <>
      {/* Nav bar */}
      <nav className={`${outfit.className} flex justify-between items-center px-8 py-4 bg-transparent transition-all duration-300 z-40`}
>
        <Link className="font-extrabold text-3xl uppercase ml-15 drop-shadow-sm" href="/">
          RacketRecs
        </Link>
        <div className="flex items-center gap-8">
  {user ? (
    <>
      <span className="font-semibold text-white">{user.email}</span>
      <button
        onClick={handleSignOut}
        className="px-6 py-2 border-2 border-white text-white rounded-full drop-shadow-sm hover:bg-white hover:text-primary-foreground transition-colors cursor-pointer"
      >
        Sign Out
      </button>
    </>
  ) : (
    <>
      <Link href="/sign-in" className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-85">
        Sign in
      </Link>
      <Link href="/sign-up" className="px-6 py-2 border-2 border-white text-white rounded-full hover:bg-white hover:text-primary-foreground transition-colors">
        Create Account
      </Link>
    </>
  )}
</div>
      </nav>

      {/*Nav bar separator*/}
      <div 
        className="right-0 h-1 bg-[#FFC038] transition-all duration-300 z-40"
        style={{ left: open ? "18rem" : "5rem", top: "60px" }}></div>
    </>
  );
}