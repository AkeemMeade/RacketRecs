import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/rackets/add
export async function POST(req: Request) {
  const body = await req.json();

  const {
    manufacturer_name,
    manufacturer_website,
    racket_name,
    series,
    balance,
    weight,
  } = body;

  // 1️⃣ Insert manufacturer
  const { data: manufacturer, error: mError } = await supabase
    .from("manufacturer")
    .insert({
      name: manufacturer_name,
      website: manufacturer_website,
    })
    .select("manufacturer_id")
    .single();

  if (mError) {
    return NextResponse.json({ error: mError.message }, { status: 500 });
  }

  // 2️⃣ Insert racket
  const { data: racket, error: rError } = await supabase
    .from("racket")
    .insert({
      manufacturer_id: manufacturer.manufacturer_id,
      name: racket_name,
      series,
      balance,
      weight,
    })
    .select("*")
    .single();

  if (rError) {
    return NextResponse.json({ error: rError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, racket });
}
