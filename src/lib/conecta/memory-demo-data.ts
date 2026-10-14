import type { DemoParticipant, EventKind, MemoryDemoNode, MinuteDraft } from "./memory-demo-types";

// All identities and records below are synthetic; no production records are read.
export const memoryDemo = {
  id: "MEM-DEMO-001",
  meetingEventId: "EVT-DEMO-001",
  minuteId: "ACT-DEMO-001",
  revisionId: "REV-DEMO-001",
  title: "Reunión de seguimiento del proceso financiero",
  context: "Grupo Análisis & Consultorías revisa cómo Gestión Financiera recibe información de los demás procesos. Este es un caso demostrativo de una capacidad transversal de la organización.",
  responsibility: "Eje Financiero",
  position: { id: "POS-DEMO-001", title: "Coordinación financiera · cargo sintético" },
  revision: "Revisión 1 · 04 oct 2026",
  evidence: [
    { id: "EVI-DEMO-001", title: "Arquitectura de macroprocesos", note: "Ubica los puntos de articulación entre ejes." },
    { id: "EVI-DEMO-002", title: "Flujograma del Eje Financiero", note: "Identifica entradas financieras a lo largo del proyecto." },
    { id: "EVI-DEMO-003", title: "Documento metodológico", note: "Describe criterios de captura y consolidación." },
    { id: "EVI-DEMO-004", title: "Registro de reunión", note: "Relaciona el hallazgo con la decisión adoptada." },
  ],
  validation: "Revisión institucional pendiente · DEMO",
  validationNote: "Este escenario no ha sido revisado ni aprobado por una autoridad institucional. La muestra no habilita una aprobación real.",
  reuse: "Incorporar puntos de captura financiera en la preparación del siguiente proyecto, con responsables por etapa y revisión antes del cierre.",
};

export const memoryNodes: readonly MemoryDemoNode[] = [
  { id: "EVT-DEMO-001", kind: "Evento", date: "2026-10-04", title: "Articulación del modelo financiero", body: memoryDemo.context, provenance: "Registro humano", relation: "La revisión del ciclo permite identificar", status: "Registrado" },
  { id: "HAL-DEMO-001", kind: "Hallazgo", date: "2026-10-04", title: "La información nace en varios ejes", body: "La información financiera necesaria se origina en múltiples procesos y responsables; su consolidación no puede depender únicamente del Eje Financiero.", provenance: "Registro humano", relation: "El hallazgo se contrasta con" },
  { id: "EVI-DEMO-001", kind: "Evidencia", date: "2026-10-04", title: "Cuatro referencias para comprender el contexto", body: "Arquitectura de macroprocesos, flujograma del Eje Financiero, documento metodológico y registro de reunión. Referencias sintéticas; no son archivos almacenados.", provenance: "Evidencia", relation: "Estas referencias informan, sin probar por sí solas," },
  { id: "DEC-DEMO-001", kind: "Decisión", date: "2026-10-04", title: "Un modelo financiero transversal", body: "Adoptar un modelo de gestión financiera transversal al ciclo del proyecto.", provenance: "Registro humano", relation: "La decisión se concreta en", status: "Adoptada · DEMO" },
  { id: "COM-DEMO-001", kind: "Compromiso", date: "2026-10-07", title: "Estructurar la captura de información", body: "Definir mecanismos estructurados para capturar información procedente de los demás ejes. Responsabilidad institucional: Eje Financiero.", provenance: "Registro humano", relation: "Su seguimiento deja registrado", status: "Seguimiento registrado · DEMO" },
  { id: "RES-DEMO-001", kind: "Resultado", date: "2026-10-18", title: "Puntos de captura definidos por etapa", body: "En el ejercicio demostrativo se documentaron puntos de captura y responsables por etapa. La revisión identificó información recibida después del momento previsto de consolidación.", provenance: "Registro humano", relation: "El resultado permite formular", status: "Resultado del ejercicio" },
  { id: "APR-DEMO-001", kind: "Aprendizaje", date: "2026-10-21", title: "Capturar tarde dificulta consolidar", body: "La captura tardía de información financiera dificulta la consolidación del proyecto.", provenance: "Registro humano", relation: "Requiere validación institucional antes de conservarse como" },
  { id: "CON-DEMO-001", kind: "Conocimiento", date: "2026-10-25", title: "Captura financiera desde cada etapa", body: "La información financiera crítica debe capturarse desde cada etapa del ciclo del proyecto.", provenance: "Derivado por sistema", relation: "Se propone reutilizar en la preparación del siguiente proyecto", status: "Propuesta · requiere revisión institucional" },
];

export const decisionTrace = memoryNodes.slice(0, 6);
export const knowledgeJourney = memoryNodes.slice(5);
export const formatMemoryDate = (date: string) => new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

export const eventKinds: readonly EventKind[] = ["Reunión", "Comité", "Decisión directiva", "Revisión de proceso", "Incidente", "Hito", "Otro"];
// Unit names/technical references come from the prototype map. People below are
// fictional fixtures and are not mapped to profiles, Auth identities or employees.
export const demoOrganizationalUnits = [
  { id: "gerencia-04", name: "Gerencia de Activos", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-06", name: "Gerencia de Innovación y Tecnología", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-12", name: "Gerencia de Aseguramiento", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-13", name: "Gerencia de Proyectos", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-10", name: "Gerencia Impuestos y Trámites", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "direccion-operaciones", name: "Gerencia de Riesgos Legales", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-08", name: "Gerencia Administrativa y Financiera", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-convenios", name: "Gerencia de Convenios", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
  { id: "gerencia-mercadeo", name: "Gerencia de Mercadeo", type: "Gerencia", source: "Mapa Vivo · Prototipo estratégico v4" },
] as const;

export const demoDirectory = [
  { id: "PER-DEMO-001", name: "Persona DEMO 01", role: "Cargo financiero de ejemplo", unitId: "gerencia-08", unit: "Gerencia Administrativa y Financiera", active: true },
  { id: "PER-DEMO-002", name: "Persona DEMO 02", role: "Cargo administrativo de ejemplo", unitId: "gerencia-08", unit: "Gerencia Administrativa y Financiera", active: true },
  { id: "PER-DEMO-003", name: "Persona DEMO 03", role: "Cargo de proyectos de ejemplo", unitId: "gerencia-13", unit: "Gerencia de Proyectos", active: true },
  { id: "PER-DEMO-004", name: "Persona DEMO 04", role: "Cargo tecnológico de ejemplo", unitId: "gerencia-06", unit: "Gerencia de Innovación y Tecnología", active: true },
  { id: "PER-DEMO-005", name: "Persona DEMO 05", role: "Cargo de aseguramiento de ejemplo", unitId: "gerencia-12", unit: "Gerencia de Aseguramiento", active: true },
  { id: "PER-DEMO-006", name: "Persona DEMO 06", role: "Cargo de activos de ejemplo", unitId: "gerencia-04", unit: "Gerencia de Activos", active: true },
  { id: "PER-DEMO-007", name: "Persona DEMO 07", role: "Cargo de trámites de ejemplo", unitId: "gerencia-10", unit: "Gerencia Impuestos y Trámites", active: true },
  { id: "PER-DEMO-008", name: "Persona DEMO 08", role: "Cargo de riesgos de ejemplo", unitId: "direccion-operaciones", unit: "Gerencia de Riesgos Legales", active: true },
  { id: "PER-DEMO-009", name: "Persona DEMO 09", role: "Cargo de convenios de ejemplo", unitId: "gerencia-convenios", unit: "Gerencia de Convenios", active: true },
  { id: "PER-DEMO-010", name: "Persona DEMO 10", role: "Cargo de mercadeo de ejemplo", unitId: "gerencia-mercadeo", unit: "Gerencia de Mercadeo", active: true },
] as const;

// Directory entries are not meeting participants until explicitly selected.
export const demoParticipants: readonly DemoParticipant[] = demoDirectory.map((person) => ({
  ...person,
  condition: "Convocado",
  invited: false,
  inherited: false,
  rsvp: "",
}));
// Projection of existing meeting_events fields; CNV is a display reference, not another event.
export const demoInvitation = {
  id: "EVT-DEMO-001", reference: "CNV-DEMO-001", name: "Reunión de seguimiento del proceso financiero",
  event_date: "2026-10-04", start_time: "09:00", end_time: "10:30", modality: "Virtual",
  address: "Canal interno demostrativo", owner_label: "Coordinación financiera", audience_label: "Equipo interprocesos",
  topics: ["Apertura y propósito", "Información financiera entre procesos", "Decisiones y compromisos", "Cierre"], status: "open",
};
export const initialMinuteDraft: MinuteDraft = {
  kind: "Reunión", otherKind: "", linked: false, subject: "", organization: "Grupo Análisis & Consultorías", unitId: "gerencia-08", process: "Gestión Financiera",
  date: "2026-10-04", start: "09:00", actualStart: "", end: "", modality: "Virtual", otherModality: "", place: "",
  objective: "", participants: [], quorum: "No aplica", quorumNote: "", agenda: [""], narrative: "", finding: "", decision: "", commitment: "",
  responsibleId: "PER-DEMO-001", due: "", risk: "", milestone: "", observations: "", authorId: "PER-DEMO-001", stage: "Borrador",
};
export const deskWork = [
  { id: "ACT-DEMO-001", title: "Acta por elaborar", detail: demoInvitation.name, destination: "capture" },
  { id: "COM-DEMO-001", title: "Compromiso abierto · ejemplo", detail: "Estructurar la captura interprocesos · plazo simulado 14 oct 2026", destination: "trace" },
  { id: "MEM-DEMO-001", title: "Memoria del escenario", detail: "Un acontecimiento y su continuidad en el tiempo", destination: "timeline" },
  { id: "CON-DEMO-001", title: "Conocimiento organizacional", detail: "Ejemplo posterior de aprendizaje revisado · validación DEMO", destination: "knowledge" },
] as const;
