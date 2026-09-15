import type { Database } from "@/lib/supabase/database.types";
import type { AccessPermission } from "./access-policy";

type Tables = Database["public"]["Tables"];
export type AgentContext = {
  user: Pick<Tables["user_profiles"]["Row"], "id" | "full_name" | "access_role" | "position_id">;
  role: Pick<Tables["positions"]["Row"], "id" | "title" | "business_unit" | "purpose" | "responsibilities" | "activities" | "authority" | "processes" | "documents"> | null;
  // Display context only. Never an authorization grant for tool execution.
  permissions: readonly AccessPermission[];
};

export const agentCapabilities = [
  { id: "write", title: "Redactar documentos", description: "Borradores, informes, oficios y presentaciones." },
  { id: "search", title: "Buscar información", description: "Normativa, procedimientos y conocimiento institucional." },
  { id: "plan", title: "Planificar trabajo", description: "Organización de tareas, compromisos y seguimiento." },
  { id: "analyze", title: "Analizar información", description: "Resúmenes, indicadores y apoyo para interpretar información." },
] as const;
export type AgentCapability = (typeof agentCapabilities)[number];
export type AgentMessage = { id: string; role: "user" | "assistant"; content: string };
export type AgentSuggestion = { id: string; title: string; description: string };

// A future transport sends queries only. The backend must resolve identity/context,
// authorize every proposed action, request confirmation, execute and audit it.
// Do not accept executable tool calls or client-supplied permissions here.
export interface AgentConversationService {
  send(input: { message: string; signal: AbortSignal }): Promise<AgentMessage>;
}
