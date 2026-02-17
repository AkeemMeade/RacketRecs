import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
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