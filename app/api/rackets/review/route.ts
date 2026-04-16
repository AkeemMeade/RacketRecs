import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: fetch average rating + current user's rating for a racket
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const racketId = searchParams.get("racketId");
  const userId = searchParams.get("userId");

  if (!racketId) {
    return NextResponse.json({ error: "Missing racketId" }, { status: 400 });
  }

  // Get all ratings for average
  const { data: allReviews, error: avgError } = await supabase
    .from("review")
    .select("rating")
    .eq("racket_id", parseInt(racketId));

  if (avgError) {
    return NextResponse.json({ error: avgError.message }, { status: 500 });
  }

  const average =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : null;

  // Get this user's rating if logged in
  let userRating = null;
  if (userId) {
    const { data: userReview } = await supabase
      .from("review")
      .select("rating")
      .eq("racket_id", parseInt(racketId))
      .eq("user_id", userId)
      .single();

    userRating = userReview?.rating ?? null;
  }

  return NextResponse.json({
    average,
    count: allReviews.length,
    userRating,
  });
}

// POST: upsert a user's rating
export async function POST(request: Request) {
  const body = await request.json();
  const { racketId, userId, rating, comment, videoUrl } = body;

  console.log("Review POST body:", body);

  if (!racketId || !userId || !rating) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("review").upsert(
    {
      user_id: userId,
      racket_id: racketId,
      rating,
      comment: comment ?? null,
      video_url: videoUrl ?? null,
      date_created: new Date().toISOString(),
    },
    { onConflict: "user_id,racket_id" }
  );

  console.log("Supabase upsert error:", error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}