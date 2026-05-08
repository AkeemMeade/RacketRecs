import { createClient } from "@/lib/supabase/client";

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("user_id", userId)
    .single();
  return data?.is_admin === true;
}