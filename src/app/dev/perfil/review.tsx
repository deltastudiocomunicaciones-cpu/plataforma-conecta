"use client";

import { useState } from "react";
import { ExecutiveRoleProfile } from "@/components/ExecutiveRoleProfile";
import data from "@/data/grupo-ac-org.json";

// Local presentation review only: no personal contact values or service writes.
export function ProfileDesignReview() {
  const [roleId, setRoleId] = useState("unidad-pymes-01");
  const [narrow, setNarrow] = useState(false);
  const [pilot, setPilot] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const role = data.nodes.find(node => node.id === roleId) ?? data.nodes[0];
  const parent = data.nodes.find(node => node.id === role.reportsTo);
  return <main style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
    <header style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: 20 }}>
      <strong>Conecta · Revisión de diseño local</strong>
      <label>Cargo <select value={roleId} onChange={e => setRoleId(e.target.value)}>{data.nodes.map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label>
      <label><input type="checkbox" checked={narrow} onChange={e => setNarrow(e.target.checked)} /> Ancho móvil</label>
      <label><input type="checkbox" checked={pilot} onChange={e => setPilot(e.target.checked)} /> Datos de prueba Nivelar</label>
    </header>
    <div style={{ maxWidth: narrow ? 360 : undefined, margin: "auto" }}>
      <h1 style={{ fontSize: 24, color: "#06213f" }}>{role.title}</h1>
      <ExecutiveRoleProfile key={role.id} role={role} parentTitle={parent?.title ?? "Máxima autoridad"} initials={(role.responsibleName || role.title).split(" ").slice(0, 2).map(s => s[0]).join("")} protectedDocument="Documento protegido" protectedPhone="Teléfono protegido" canViewSensitiveData={false} showSensitiveData={false} onToggleSensitiveData={() => {}} onSelectRole={id => setRoleId(id)} directReports={data.nodes.filter(node => node.reportsTo === role.id)} onOpenReports={() => setReportsOpen(true)} nivelar={pilot ? { productive: "82%", connection: "40 h", unproductive: "6%", unclassified: "12%", workWindow: "Semana de ejemplo", statusLabel: "Piloto", interpretation: "Ejemplo de lectura de actividad para revisar la presentación del contenido.", conectaReading: "Contrastar actividad con avances y evidencias del informe del cargo.", recommendedAction: "Revisar los pendientes del periodo con el responsable." } : null} />
      {reportsOpen && <div role="status" style={{ padding: 20, background: "#f3f9e7" }}>Acción verificada: consultar informes de {role.title}. En esta revisión no se crean ni envían informes.</div>}
    </div>
  </main>;
}
