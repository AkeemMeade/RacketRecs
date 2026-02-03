import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("racket")
    .insert([
      {
        name: body.racket_name,
        series: body.series,
        balance: body.balance,
        weight: body.weight,
        manufacturer_id: body.manufacturer_id,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
