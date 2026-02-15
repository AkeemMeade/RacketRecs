import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("racket") 
    .select("racket_id, name, color, balance, stiffness, price, max_tension, availability, weight, img_url");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
