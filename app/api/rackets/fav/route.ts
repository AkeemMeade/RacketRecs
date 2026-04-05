import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { racketId, userId } = body;

  if (!userId || !racketId) {
    return NextResponse.json(
      { error: "Missing userId or racketId" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("favorites").insert([
    {
      user_id: userId,
      racket_id: racketId,
      date_added: new Date().toISOString(),
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);  // Extract search parameters from the request URL
  const userId = searchParams.get("userId");  // Get the userId from the search parameters. This is necessary to fetch the correct favorites for the user.
  
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .select(`
      racket_id,
      racket:racket_id (
      name,
      img_url
      )
    `)  // Select the racket_id from the favorites table and also join with the rackets table to get the name and img_url of each favorited racket
    .eq("user_id", userId);  // Filter the favorites by the userId to get only the favorites for the specific user

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}


export async function DELETE(request: Request) {
  const body = await request.json();
  const { racketId, userId } = body;

  if (!userId || !racketId) {
    return NextResponse.json(
      { error: "Missing userId or racketId" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("racket_id", racketId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}