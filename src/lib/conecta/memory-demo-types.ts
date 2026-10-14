/** Presentation-only fixtures. Not a persistence or institutional identity contract. */
export type MemoryKind = "Evento" | "Hallazgo" | "Evidencia" | "Decisión" | "Compromiso" | "Resultado" | "Aprendizaje" | "Conocimiento";
export type MemoryProvenance = "Registro humano" | "Evidencia" | "Derivado por sistema";
export interface MemoryDemoNode {
  id: string;
  kind: MemoryKind;
  date: string;
  title: string;
  body: string;
  provenance: MemoryProvenance;
  relation: string;
  status?: string;
}

export type EventKind = "Reunión" | "Comité" | "Decisión directiva" | "Revisión de proceso" | "Incidente" | "Hito" | "Otro";
export type MinuteStage = "Borrador";
export type ParticipationCondition = "Convocado" | "Asistente" | "Ausente" | "Excusado" | "Invitado";
export interface DemoParticipant {
  id: string;
  name: string;
  role: string;
  unitId: string;
  unit: string;
  condition: ParticipationCondition;
  invited: boolean;
  inherited: boolean;
  rsvp: "" | "Confirmada" | "Virtual" | "Pendiente" | "Rechazada";
}
export interface DemoDirectoryPerson {
  id: string;
  name: string;
  role: string;
  unitId: string;
  active: boolean;
}
export interface MinuteDraft {
  kind: EventKind;
  otherKind: string;
  linked: boolean;
  subject: string;
  organization: string;
  unitId: string;
  process: string;
  date: string;
  start: string;
  actualStart: string;
  end: string;
  modality: string;
  otherModality: string;
  place: string;
  objective: string;
  participants: DemoParticipant[];
  quorum: "Cumplido" | "No cumplido" | "No aplica";
  quorumNote: string;
  agenda: string[];
  narrative: string;
  finding: string;
  decision: string;
  commitment: string;
  responsibleId: string;
  due: string;
  risk: string;
  milestone: string;
  observations: string;
  authorId: string;
  stage: MinuteStage;
  convener: string;
  institutionalResponsible: string;
  development: string;
  findings: MemoryEntry[];
  decisions: MemoryEntry[];
  commitments: MemoryCommitment[];
  risks: MemoryEntry[];
}

export interface MemoryEntry { id: string; text: string; }
export interface MemoryCommitment extends MemoryEntry { responsibleFunction: string; due: string; }
/** Browser-only demonstrative document. Never an institutional archive record. */
export interface MemoryMinuteDocument {
  id: string;
  code: string;
  draft: MinuteDraft;
  createdAt: string;
  updatedAt: string;
  demoVersion: 1;
  provenance: "DEMO_LOCAL";
}
