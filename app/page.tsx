import Link from "next/link";
import { Outfit, Roboto } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});


export default function Home() {
  return (
    <main>
      <nav className={`${outfit.className} mt-9 flex justify-center items-center gap-6 p-4`}>
        <Link className={`text-center font-extrabold text-3xl uppercase mr-220`} href="/Home">RacketRecs</Link>
        <br />
        <Link href="/about">about</Link>
        <br />
        <Link href="/contact">contact</Link>
        <br />
        <Link href="/sign-in" className="px-4 py-2 bg-primary text-primary-foreground rounded-4xl hover:opacity-90">Sign In</Link>
        <br />
        <Link href="/sign-up" className="px-4 py-2 border-2 border-white text-white rounded-4xl hover:opacity-90">Create Account</Link>
      </nav>
      <br />

      <div className="w-full h-2 bg-[#FFC038]"></div>

      <div className="my-45">
        <h1 className={`text-center ${outfit.className} font-extrabold text-7xl`}>Personalized Racket <br /> Recommendations, Made Simple</h1>
        <h2 className={`text-center my-15 ${roboto.className} text-2xl`}>Our assessment matches you with rackets designed for your game.</h2>
      </div>
      <div className="flex justify-center gap-4 -mt-25">
        <Link href="/assessment" className="px-7 py-4 bg-[#FFC038] text-white tracking-widest font-semibold rounded-full hover:opacity-90">Player Assessment</Link>
        <br />
        <Link href="/rackets" className="px-7 py-4 bg-[#FFC038] text-white tracking-widest font-semibold rounded-full hover:opacity-90">Browse Rackets</Link>
        <br />
      </div>
    </main>
  );
}