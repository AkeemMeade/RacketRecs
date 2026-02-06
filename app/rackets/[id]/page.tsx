import { createClient } from "@supabase/supabase-js";
import { Outfit, Roboto } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function RacketDetails({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params; 

  const { data: racket } = await supabase
    .from('racket')
    .select('*')
    .eq('racket_id', id)
    .single();

  if (!racket) {
    return <div>Racket not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="">
      <h1 className={`text-center ${outfit.className} font-thin text-7xl text-black`}>{racket.name} {racket.series}</h1>
      </div>
    </div>
);
}