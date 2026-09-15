import { redirect } from "next/navigation";
import { AgentWorkspace } from "@/components/agent/AgentWorkspace";
import { MapExit } from "@/components/MapExit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accessRolePermissions } from "@/lib/conecta/access-policy";

export const metadata = { title: "Mi agente | Plataforma Conecta" };

export default async function AgentPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  if (authError) throw new Error("No se pudo verificar la sesión.");
  const { data: profile, error } = await supabase.from("user_profiles")
    .select("id, full_name, access_role, position_id, company_id")
    .eq("auth_user_id", user.id).eq("is_active", true).maybeSingle();
  if (error) throw new Error("No se pudo consultar el perfil.");
  if (!profile) redirect("/acceso");
  const positionResponse = profile.position_id
    ? await supabase.from("positions")
      .select("id, title, business_unit, purpose, responsibilities, activities, authority, processes, documents")
      .eq("id", profile.position_id).eq("company_id", profile.company_id).maybeSingle()
    : { data: null, error: null };
  if (positionResponse.error) throw new Error("No se pudo consultar el contexto del cargo.");
  return <>
    <MapExit authenticated />
    <AgentWorkspace context={{
      user: { id: profile.id, full_name: profile.full_name, access_role: profile.access_role, position_id: profile.position_id },
      role: positionResponse.data,
      permissions: accessRolePermissions[profile.access_role],
    }} />
  </>;
}
