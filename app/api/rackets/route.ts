import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("racket")
    .select(`
      racket_id,
      name,
      stiffness,
      balance,
      weight,
      img_url,
      manufacturer_id,
      manufacturer:manufacturer_id (
        manufacturer_id,
        name
      ),
      racket_retailer (
        price
      )
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
