import type { InstitutionalProfile, SourceBlock } from "@/lib/conecta/institutional-profile";
import { NORMATIVE_NOTE } from "@/lib/conecta/institutional-profile";
import { ProfileDisclosure } from "./FunctionalResponsibilities";
import styles from "./ExecutiveRoleProfile.module.css";
import type { ReactNode } from "react";

function InstitutionalGroup({ title, overview, children }: { title: string; overview: ReactNode; children: ReactNode }) {
  return <section className={styles.institutionalGroup} aria-label={title}>
    <h4 className={styles.institutionalGroupTitle}>{title}</h4>
    <div className={styles.institutionalOverview}>{overview}</div>
    <ProfileDisclosure title={`Profundizar · ${title}`}>{children}</ProfileDisclosure>
  </section>;
}

const pendingLabels: Record<string, string> = {
  "code.approval": "Aprobación del código institucional", "deliverables.approval": "Validación de familias de entregables",
  "raci.approval": "Conciliación y aprobación de RACI", "competencies.approval": "Validación de competencias y conductas",
  "governance.cadences": "Cadencias pendientes de gobierno", "traceability.*.evidence": "Evidencia vinculada a cada macroresponsabilidad",
  "traceability.*.risk": "Riesgo vinculado a cada macroresponsabilidad", "traceability.*.control": "Control vinculado a cada macroresponsabilidad",
  "evidenceContract.*.pendingDefinition": "Campos individuales pendientes del contrato de evidencia",
  "indicators.proposals.approval": "Conciliación y aprobación de indicadores propuestos", "authority.specificLimits": "Límites específicos de autoridad",
  "conceptualStates.reconciliation": "Conciliación de estados conceptuales del resultado",
  code: "Código institucional", person: "Persona asignada", dependency: "Dependencia", nature: "Naturaleza del cargo",
  managementFramework: "Marco de gestión", normativeReference: "Referencia normativa", documentVersion: "Versión documental",
  documentStatus: "Estado documental", reviewStatus: "Estado de revisión", dimensions: "Dimensiones institucionales", preamble: "Identidad y base metodológica",
  lifecycle: "Ciclo de vida", boundaries: "Fronteras y exclusiones", deliverables: "Entregables", evidence: "Evidencia documentada",
  raci: "Matriz de responsabilidades RACI", gate: "Gate de Transferencia Operativa", governance: "Cadencia de gobierno", improvement: "Mejora",
  support: "Arquitectura de soporte", doctrines: "Doctrinas institucionales", approval: "Control y aprobación", alerts: "Alertas", evaluation: "Evaluación",
  "processes.*.input": "Entrada del proceso", "processes.*.output": "Salida del proceso", "processes.*.responsibilities": "Responsabilidades asociadas al proceso",
  "processes.*.deliverables": "Entregables asociados al proceso", "processes.*.evidence": "Evidencias asociadas al proceso",
  "processes.*.indicators": "Indicadores asociados al proceso", "processes.*.risks": "Riesgos asociados al proceso", "processes.*.controls": "Controles asociados al proceso",
  "responsibilities.*.classification": "Clasificación de responsabilidades", "indicators.*.formula": "Fórmula del indicador", "indicators.*.interpretation": "Interpretación del indicador",
  "indicators.*.source": "Fuente del indicador", "indicators.*.frequency": "Frecuencia del indicador", "indicators.*.responsible": "Responsable del indicador",
  "indicators.*.baseline": "Línea base del indicador", "indicators.*.target": "Meta aprobada del indicador", "risks.*.control": "Control asociado al riesgo",
  "risks.*.evidence": "Evidencia del control de riesgo", "risks.*.responsible": "Responsable del riesgo", "risks.*.status": "Estado del riesgo", "risks.*.alert": "Alerta asociada al riesgo",
  "gate.criteria.*.evidence": "Evidencia de los criterios de transferencia", "gate.criteria.*.responsible": "Responsable de los criterios de transferencia",
  "approval.*.decision": "Decisión o firma de aprobación", "approval.*.date": "Fecha de aprobación", "competencies.*.behavior": "Comportamiento observable de la competencia",
};

function SourceContent({ blocks }: { blocks: SourceBlock[] }) {
  return blocks.map((block, i) => block.kind === "table" && block.rows ? <div key={i} className={styles.institutionalTable} tabIndex={0} role="region" aria-label="Tabla del documento maestro"><table><thead><tr>{block.rows[0].map((cell, j) => <th scope="col" key={j}>{cell}</th>)}</tr></thead><tbody>{block.rows.slice(1).map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}>{cell || "Pendiente de definición"}</td>)}</tr>)}</tbody></table></div> : <p className={styles.sourceParagraph} key={i}>{block.text}</p>);
}
export function InstitutionalRoleProfile({ profile }: { profile: InstitutionalProfile }) {
  const pending = profile.fieldMapping.filter(item => item.category === "C");
  const context = profile.institutionalContext;
  const documentarySections = (codes: string[]) => profile.documentarySource?.sections.filter(section => codes.includes(section.code)).map(section => <ProfileDisclosure key={section.code} title={`Fuente Word · ${section.title}`}><SourceContent blocks={section.blocks} /></ProfileDisclosure>);
  const pendingDetail = <ProfileDisclosure title={`Definición institucional pendiente · ${pending.length}`}><ul>{pending.map(item => <li key={item.field}>{pendingLabels[item.field] || "Definición institucional adicional"}</li>)}</ul><p>Los vínculos y registros pendientes no representan resultados medidos ni aprobaciones.</p></ProfileDisclosure>;
  const stateNote = (field: keyof InstitutionalProfile) => {
    const entry = context?.fieldStates.find(item => item.field === field);
    return entry ? <p className={styles.note}><strong>{entry.state}</strong> · {entry.note}</p> : null;
  };
  return <section aria-label="Arquitectura institucional del cargo" className={styles.detailsGroup}>
    <h3>Arquitectura institucional del cargo</h3>
    {profile.code === "SDX-001" && <p className={styles.note}>Arquitectura Institucional V2 / Documento Maestro SDX-001 · Propuesta para revisión y aprobación institucional.</p>}
    <p>{profile.code || "Código institucional pendiente"} · Versión {profile.documentVersion || "pendiente"} · {profile.documentStatus || "Control documental pendiente"}</p>
    {profile.normativeReference && <><p>Arquitectura de cargo diseñada bajo una lógica de gestión por procesos compatible con {profile.normativeReference}.</p><p className={styles.note}>{NORMATIVE_NOTE}</p></>}
    {profile.preamble && <ProfileDisclosure title="Identidad y base metodológica"><SourceContent blocks={profile.preamble} /></ProfileDisclosure>}
    {profile.dimensions?.map(dimension => <ProfileDisclosure key={dimension.code} title={`${dimension.code} · ${dimension.title}`}>
      {profile.code === "SDX-001" && (dimension.code === "03" || dimension.code === "06") && <p className={styles.note}>{dimension.code === "06" ? "Indicadores K01–K06" : "Responsabilidades y frontera"} · Arquitectura Institucional V2 / Documento Maestro SDX-001. Estado documental: propuesta para revisión y aprobación institucional.</p>}
      <SourceContent blocks={dimension.blocks} />{dimension.code === "10" && <p>Estado del GTO: No evaluado. Los criterios no cuentan con evaluación ni evidencia registrada.</p>}{dimension.code === "06" && <p>Fuente, frecuencia, responsable, línea base y meta aprobada: pendientes de definición institucional para K01–K06.</p>}</ProfileDisclosure>)}
    {context && <>
      <InstitutionalGroup title="Identidad del cargo" overview={<><p><strong>{profile.name}</strong> · {context.systemicRole} · {context.functionalLevel} · {profile.dependency}</p><p>{context.superiorResult}</p></>}>
      <ProfileDisclosure title="Identidad institucional">
        <p>{profile.code} · {profile.name} · {profile.person?.positionId}</p>
        <p>Titular: {profile.person?.name || "Pendiente"} · Dependencia: {profile.dependency}</p>
        <p>Área: {context.area} · Nivel funcional: {context.functionalLevel}</p>
        {stateNote("code")}{stateNote("nature")}
      </ProfileDisclosure>
      <ProfileDisclosure title="Propósito y resultado superior"><p>{profile.purpose}</p><h4>Resultado superior</h4><p>{context.superiorResult}</p></ProfileDisclosure>
      <ProfileDisclosure title={`Rol funcional · ${context.systemicRole}`}><p>{context.separation.join(" → ")}</p><p className={styles.note}>Separación funcional de responsabilidades; no modifica la jerarquía ni los reportes directos del mapa.</p></ProfileDisclosure>
      {documentarySections(["1", "2", "3"])}
      </InstitutionalGroup>
      <InstitutionalGroup title="Arquitectura de gestión" overview={<><p>Procesos, macroresponsabilidades y autoridad; entregables, evidencia, indicadores y riesgos.</p><p className={styles.note}>El detalle funcional y sus controles se conservan en la ficha. Las propuestas y definiciones pendientes mantienen su estado.</p></>}>
      <ProfileDisclosure title="Procesos / macroproceso">
        <ul>{context.relatedProcesses.map(process => <li key={process.code}>{process.code} · {process.name}</li>)}</ul>
        <h4>Dirección transversal existente</h4><ul>{profile.processes.map(process => <li key={process.code}>{process.code} · {process.name}</li>)}</ul>
        <p className={styles.note}>La ficha funcional conserva íntegramente responsabilidades, subactividades, tareas, controles y resultados.</p>
      </ProfileDisclosure>
      <ProfileDisclosure title="Macroresponsabilidades institucionales"><ul>{context.macroResponsibilities.map(item => <li key={item.code}>{item.code} · {item.description}</li>)}</ul><p className={styles.note}>No sustituyen las siete responsabilidades funcionales existentes.</p></ProfileDisclosure>
      <ProfileDisclosure title="Autoridad y fronteras">{stateNote("authority")}<ul>{profile.authority?.map(item => <li key={item}>{item}</li>)}</ul><h4>Frontera funcional</h4><ul>{profile.boundaries?.map(item => <li key={item}>{item}</li>)}</ul></ProfileDisclosure>
      <ProfileDisclosure title="Entregables / evidencia">{stateNote("deliverables")}{stateNote("evidence")}{documentarySections(["8"])}{profile.evidenceContract && <><h4>Contrato mínimo de evidencia</h4><p className={styles.note}>Requisito de evidencia ≠ evidencia producida ≠ evidencia validada.</p><ul>{profile.evidenceContract.map(item => <li key={item.field}>{item.field} · {item.function || "PENDIENTE DE DEFINICIÓN individual en la fuente"}</li>)}</ul></>}</ProfileDisclosure>
      <ProfileDisclosure title="Indicadores">{stateNote("indicators")}<ul>{profile.indicators.map(item => <li key={item.code}>{item.name}</li>)}</ul></ProfileDisclosure>
      <ProfileDisclosure title="Riesgos / controles">{stateNote("risks")}<ul>{profile.risks.map(item => <li key={item.risk}>{item.risk}</li>)}</ul></ProfileDisclosure>
      {documentarySections(["4", "5", "6", "7", "9", "10"])}
      {profile.traceability && <ProfileDisclosure title="Matriz maestra de trazabilidad"><p className={styles.note}>Relaciones documentadas sujetas a validación. Evidencia, riesgo y control por fila no están definidos en la fuente y permanecen pendientes.</p>{documentarySections(["15"])}</ProfileDisclosure>}
      </InstitutionalGroup>
      <InstitutionalGroup title="Gobierno institucional" overview={<><p>Versión {profile.documentVersion} · {profile.documentStatus}</p><p className={styles.note}>Contenido existente, propuestas para validación y definiciones pendientes se distinguen en cada sección.</p><p><strong>Definición institucional pendiente · {pending.length}</strong></p><p className={styles.note}>Pendientes documentales; no equivalen a una calificación ni a un porcentaje de madurez.</p></>}>
      <ProfileDisclosure title="RACI">{stateNote("raci")}</ProfileDisclosure>
      <ProfileDisclosure title="Competencias">{stateNote("competencies")}<ul>{profile.competencies?.map(item => <li key={item.name}>{item.name}</li>)}</ul></ProfileDisclosure>
      <ProfileDisclosure title="Gobierno / evaluación / mejora">{stateNote("governance")}{stateNote("evaluation")}{stateNote("improvement")}</ProfileDisclosure>
      <ProfileDisclosure title="Estado documental"><p>Versión {profile.documentVersion} · {profile.documentStatus}</p><p>Fuente: {profile.source}</p>{stateNote("approval")}</ProfileDisclosure>
      {profile.lifecycle && <ProfileDisclosure title="Ciclo institucional"><p>{profile.lifecycle.join(" → ")}</p><p className={styles.note}>Ciclo indicado en C01-IMP-04 §12; no se atribuye como transcripción literal del Word.</p></ProfileDisclosure>}
      {documentarySections(["0", "11", "12", "13", "14", "16", "17", "18", "19", "20", "21", "A", "B"])}
      {profile.documentarySource?.comparisons?.map(comparison => <ProfileDisclosure key={comparison.source} title={`Conciliación documental pendiente · ${comparison.section}`}><p className={styles.note}>PROPUESTA PARA VALIDACIÓN. Ninguna versión se adopta como autoridad vigente.</p><p>{comparison.source} · SHA-256 {comparison.sha256}</p><SourceContent blocks={[{ kind: "table", rows: comparison.rows }]} /><ul>{comparison.conflicts.map(item => <li key={item}>{item}</li>)}</ul></ProfileDisclosure>)}
      {profile.documentarySource && <ProfileDisclosure title="Procedencia y conflictos documentales"><p>Fuente Word SHA-256: {profile.documentarySource.sha256}</p><SourceContent blocks={profile.documentarySource.preamble} /><ul>{profile.documentarySource.conflicts.map(item => <li key={item}>{item}</li>)}</ul></ProfileDisclosure>}
      {pendingDetail}
      </InstitutionalGroup>
    </>}
    {!profile.dimensions && !context && <>
      <ProfileDisclosure title="Propósito"><p>{profile.purpose || "Pendiente de definición"}</p></ProfileDisclosure>
      <ProfileDisclosure title="Procesos"><ul>{profile.processes.map(process => <li key={process.code}>{process.code} · {process.name}</li>)}</ul><p>Se conserva la estructura completa de responsabilidades, subactividades, tareas, controles y resultados en la ficha funcional.</p></ProfileDisclosure>
      <ProfileDisclosure title="Entregables, evidencias, RACI, gobierno y control documental"><p>Pendientes de definición institucional. Los resultados y controles existentes se mantienen como tales; requieren validación antes de clasificarlos como entregables o evidencia requerida.</p></ProfileDisclosure>
    </>}
    {!context && pendingDetail}
  </section>;
}
