import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ManagementReportInsert = Database["public"]["Tables"]["management_reports"]["Insert"];

export async function createManagementReport(input: ManagementReportInsert) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("management_reports")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listReportsForPosition(positionId: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("management_reports")
    .select("*")
    .eq("position_id", positionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

