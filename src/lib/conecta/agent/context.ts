import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { AgentContext } from "../agent";

export type AgentContextResult =
  | { status: "unauthenticated" | "forbidden"; context: null }
  | { status: "ready" | "missing_position" | "incomplete_position"; context: AgentContext };

// Only a session-bound server client. No caller-supplied identity or permissions.
export async function resolveAgentContext(client: SupabaseClient<Database>): Promise<AgentContextResult> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { status: "unauthenticated", context: null };
  const { data: profile, error: profileError } = await client.from("user_profiles")
    .select("id, full_name, access_role, position_id, company_id")
    .eq("auth_user_id", user.id).eq("is_active", true).maybeSingle();
  if (profileError) throw new Error("AGENT_PROFILE_READ_FAILED");
  if (!profile) return { status: "forbidden", context: null };
  const { data: company, error: companyError } = await client.from("companies")
    .select("id").eq("id", profile.company_id).eq("status", "active").maybeSingle();
  if (companyError) throw new Error("AGENT_COMPANY_READ_FAILED");
  if (!company) return { status: "forbidden", context: null };
  const context: AgentContext = {
    user: { id: profile.id, full_name: profile.full_name, access_role: profile.access_role, position_id: profile.position_id },
    role: null,
    // No executable capabilities in this pilot; display context is not a grant.
    permissions: [],
  };
  if (!profile.position_id) return { status: "missing_position", context };
  const { data: role, error: roleError } = await client.from("positions")
    .select("id, title, business_unit, purpose, responsibilities, activities, authority, processes, documents")
    .eq("id", profile.position_id).eq("company_id", profile.company_id).maybeSingle();
  if (roleError) throw new Error("AGENT_POSITION_READ_FAILED");
  if (!role) return { status: "missing_position", context };
  context.role = role;
  const complete = role.purpose.trim().length > 0 && role.responsibilities.some(item => item.trim().length > 0);
  return { status: complete ? "ready" : "incomplete_position", context };
}
