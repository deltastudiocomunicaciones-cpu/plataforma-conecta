import { notFound } from "next/navigation";
import { AgentWorkspace } from "@/components/agent/AgentWorkspace";

export default function AgentDesignReview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main className="agent-workspace" style={{ padding: 20 }}>
    <p style={{ marginBottom: 20 }}>Revisión visual local · Identidad y cargo de ejemplo</p>
    <AgentWorkspace context={{
      user: { id: "preview", full_name: "Usuario de ejemplo", access_role: "responsable", position_id: "preview-role" },
      role: { id: "preview-role", title: "Contador Auditor", business_unit: "Pymes", purpose: "Acompañar al equipo y asegurar la calidad de la información contable de las organizaciones asignadas.", responsibilities: ["Revisar información y documentar hallazgos.", "Planear entregables y verificar evidencias."], activities: [], authority: ["Actuar dentro del alcance de su cargo."], processes: ["Macroproceso contable"], documents: ["Ficha del cargo"] },
      permissions: [],
    }} />
  </main>;
}
