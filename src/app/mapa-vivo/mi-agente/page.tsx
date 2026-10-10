import { redirect } from "next/navigation";
import { AgentWorkspace } from "@/components/agent/AgentWorkspace";
import { MapExit } from "@/components/MapExit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveAgentContext } from "@/lib/conecta/agent/context";
import { enrichInstitutionalContext } from "@/lib/conecta/agent/institutional-context";

export const metadata = { title: "Mi agente | Plataforma Conecta" };

export default async function AgentPage() {
  const result = await resolveAgentContext(await createSupabaseServerClient());
  if (!result.context) redirect("/acceso");
  const context = enrichInstitutionalContext(result.context);
  return <>
    <MapExit authenticated />
    {result.status !== "ready" && <p className="agent-panel" role="status">
      {result.status === "missing_position"
        ? "Tu cuenta todavía no tiene un cargo disponible. La administración debe revisar la asignación antes de iniciar la prueba del agente."
        : "La ficha de tu cargo en la plataforma necesita propósito y responsabilidades. Deben publicarse antes de iniciar la prueba del agente."}
    </p>}
    <AgentWorkspace context={context} />
  </>;
}
