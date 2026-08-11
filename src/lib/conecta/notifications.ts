import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

export async function createNotification(input: NotificationInsert) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("notifications").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listMyNotifications(profileId: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

