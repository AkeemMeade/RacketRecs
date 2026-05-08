import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const racketId = searchParams.get("racketId");

  if (!racketId) {
    return NextResponse.json({ error: "Missing racketId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("review")
    .select("review_id, rating, comment, video_url, date_created")
    .eq("racket_id", parseInt(racketId))
    .order("date_created", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}