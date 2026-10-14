import type { MemoryMinuteDocument } from "./memory-demo-types";

export const MEMORY_STORE_KEY = "conecta:memory-viva:demo:v1";
export const MEMORY_BACKUP_LIMIT = 2_000_000;

export function isMemoryMinuteDocument(value: unknown): value is MemoryMinuteDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<MemoryMinuteDocument>;
  return typeof doc.id === "string" && doc.id.startsWith("ACT-DEMO-")
    && typeof doc.code === "string" && doc.provenance === "DEMO_LOCAL" && doc.demoVersion === 1
    && typeof doc.createdAt === "string" && typeof doc.updatedAt === "string"
    && Boolean(doc.draft && typeof doc.draft === "object" && typeof doc.draft.subject === "string"
      && typeof doc.draft.unitId === "string" && Array.isArray(doc.draft.participants)
      && Array.isArray(doc.draft.agenda) && Array.isArray(doc.draft.decisions)
      && Array.isArray(doc.draft.commitments) && Array.isArray(doc.draft.risks));
}

export function decodeMemoryBackup(json: string): MemoryMinuteDocument[] {
  if (json.length > MEMORY_BACKUP_LIMIT) throw new Error("El respaldo supera el límite de 2 MB.");
  const parsed: unknown = JSON.parse(json);
  const docs = Array.isArray(parsed) ? parsed : (parsed as { documents?: unknown } | null)?.documents;
  if (!Array.isArray(docs) || !docs.every(isMemoryMinuteDocument)) throw new Error("El archivo no tiene un respaldo DEMO válido.");
  if (new Set(docs.map((doc) => doc.id)).size !== docs.length) throw new Error("El respaldo contiene identificadores duplicados.");
  return docs;
}

export function upsertMemoryDocument(documents: readonly MemoryMinuteDocument[], incoming: MemoryMinuteDocument): MemoryMinuteDocument[] {
  const found = documents.some((document) => document.id === incoming.id);
  return found ? documents.map((document) => document.id === incoming.id ? incoming : document) : [incoming, ...documents];
}

export function serializeMemoryBackup(documents: readonly MemoryMinuteDocument[]): string {
  return JSON.stringify({ format: "CONECTA_MEMORY_DEMO", version: 1, documents }, null, 2);
}
