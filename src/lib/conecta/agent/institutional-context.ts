import orgData from "@/data/grupo-ac-org.json";
import type { AgentContext } from "../agent";
import { getInstitutionalProfile } from "../institutional-profile";

// Called only after resolveAgentContext validates session, company and position.
// These public document templates supply context, never executable permissions.
export function enrichInstitutionalContext(context: AgentContext): AgentContext {
  const role = context.role;
  const assigned = role && context.user.position_id === role.id;
  // The UUID remains the authorized position identity. external_key supplies
  // an exact catalogue reference, never a name-based fallback or permission.
  const catalogueKey = assigned ? role.external_key ?? role.id : null;
  const matches = catalogueKey ? orgData.nodes.filter(node => node.id === catalogueKey) : [];
  const template = matches.length === 1 ? matches[0] : null;
  return { ...context, institutionalProfile: template ? getInstitutionalProfile({ ...template, responsibleName: context.user.full_name }) : null };
}
