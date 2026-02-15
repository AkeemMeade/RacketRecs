import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
    const { racket_id, user_id } = await request.json();

    const { error } = await supabase
        .from("favorites")
        .insert(user_id, racket_id);

    return NextResponse.json({ success: !error, error: error ? error.message : null });
}

export async function DELETE(request: Request) {
  const { racketId, userId } = await request.json();
  
  // Delete from favorites table
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("racket_id", racketId);
  
  return NextResponse.json({ success: !error });
}