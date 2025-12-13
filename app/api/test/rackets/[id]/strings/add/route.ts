import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // 1. Insert a manufacturer
  const { data: manufacturer, error: mError } = await supabase
    .from("manufacturer")
    .insert([
      {
        name: "Victor",
        website: "https://www.victorsport.com/en-US",
      },
    ])
    .select();

  if (mError) {
    return NextResponse.json({ error: mError }, { status: 400 });
  }

  const manufacturerId = manufacturer[0].manufacturer_id;

  // 2. Insert a racket using the new manufacturer ID
  const { data: racket, error: rError } = await supabase
    .from("racket")
    .insert([
      {
        manufacturer_id: manufacturerId,
        name: "F Claw",
        series: "Thruster",
        balance: "Head-Heavy",
        stiffness: "Stiff",
        price: 199.99,
      },
    ])
    .select();

  if (rError) {
    return NextResponse.json({ error: rError }, { status: 400 });
  }

  return NextResponse.json(
    {
      manufacturerInserted: manufacturer,
      racketInserted: racket,
    },
    { status: 200 }
  );
}
