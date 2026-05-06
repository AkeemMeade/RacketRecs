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
    <main className="relative min-h-screen">
      

      <div className="relative z-10">
        {/* Hero section */}
        <div className="my-24">
          <h1
            className={`text-center ${outfit.className} font-extrabold text-7xl text-white drop-shadow-lg`}
          >
            Personalized Racket <br /> Recommendations, Made Simple
          </h1>
          <h2
            className={`text-center my-8 ${roboto.className} text-2xl text-white drop-shadow-lg`}
          >
            Our assessment matches you with rackets designed for your game.
          </h2>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <Link
            href="/assessment"
            className="px-8 py-4 bg-[#FFC038] text-white tracking-widest font-semibold rounded-full hover:bg-[#e6ac32] transition-colors"
          >
            Player Assessment
          </Link>
          <Link
            href="/rackets"
            className="px-8 py-4 bg-[#FFC038] text-white tracking-widest font-semibold rounded-full hover:bg-[#e6ac32] transition-colors"
          >
            Browse Rackets
          </Link>
        </div>
      </div>
    </main>
  );
}