import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json();
  console.log("deleting user:", userId);

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  await supabase.from("assessment").delete().eq("user_id", userId);
  await supabase.from("stock_notifications").delete().eq("user_id", userId);
  await supabase.from("posts").delete().eq("user_id", userId);
  await supabase.from("browsing_history").delete().eq("user_id", userId);
  await supabase.from("marketplace_listings").delete().eq("seller_id", userId);
  await supabase.from("profiles").delete().eq("id", userId);
  await supabase.from("review").delete().eq("user_id", userId);
  await supabase.from("favorites").delete().eq("user_id", userId);
  await supabase.from("assessment_response").delete().eq("user_id", userId);
  await supabase.from("tracked_rackets").delete().eq("user_id", userId);

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}