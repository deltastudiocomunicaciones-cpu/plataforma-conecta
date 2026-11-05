"use client";

import { useMemo, useState } from "react";
import type { InstitutionalMeeting, InstitutionalMinute } from "@/lib/conecta/institutional-minutes";
import type { MinuteDraft } from "@/lib/conecta/memory-demo-types";
import styles from "./MemoryDemo.module.css";

type Source = { code: string; id: string; version: number; status: string; title: string; meeting?: InstitutionalMeeting; createdAt: string; draft: MinuteDraft };
type Entry = { key: string; kind: "Decisión propuesta" | "Compromiso propuesto" | "Contexto"; text: string; source: Source };

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function InstitutionalIntelligence({ minutes, meetings, loading, error, onOpen }: {
  minutes: InstitutionalMinute[];
  meetings: InstitutionalMeeting[];
  loading: boolean;
  error: string;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const entries = useMemo(() => {
    const output: Entry[] = [];
    for (const minute of minutes) {
      if (!minute.payload || typeof minute.payload !== "object" || Array.isArray(minute.payload)) continue;
      const draft = minute.payload as Partial<MinuteDraft>;
      const source: Source = {
        code: minute.code, id: minute.id, version: minute.version,
        status: minute.status, title: minute.title,
        createdAt: minute.createdAt,
        meeting: meetings.find((meeting) => meeting.id === minute.meetingEventId),
        draft: draft as MinuteDraft,
      };
      const add = (kind: Entry["kind"], text: unknown, key: string) => {
        if (typeof text !== "string" || !text.trim()) return;
        output.push({ key: minute.id + ":" + key, kind, text: text.trim(), source });
      };
      add("Contexto", draft.objective, "objective");
      add("Contexto", draft.narrative, "narrative");
      add("Decisión propuesta", draft.decision, "decision");
      for (const [i, entry] of (Array.isArray(draft.decisions) ? draft.decisions : []).entries()) add("Decisión propuesta", entry?.text, "decisions-" + i);
      add("Compromiso propuesto", draft.commitment, "commitment");
      for (const [i, entry] of (Array.isArray(draft.commitments) ? draft.commitments : []).entries()) add("Compromiso propuesto", entry?.text, "commitments-" + i);
    }
    return output;
  }, [minutes, meetings]);
  const visible = entries.filter((entry) => (!kind || entry.kind === kind) && (!query.trim() ||
    normalize([entry.text, entry.source.code, entry.source.title, entry.source.meeting?.name ?? ""].join(" ")).includes(normalize(query.trim()))));
  return <section className={styles.panel} aria-label="Inteligencia documental sobre actas institucionales">
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>FUENTES INSTITUCIONALES · SUPABASE · RLS</p><h2>Explorador documental real</h2>
      <p>Consulta de contexto y propuestas extraídas de actas que tu sesión puede leer. Cada resultado conserva su documento de origen.</p>
    </div></div>
    <p className={styles.contextBand}>IMPORTANTE · Los documentos disponibles siguen en borrador. Las decisiones y compromisos mostrados son propuestas documentadas, no acuerdos aprobados, órdenes asignadas ni verificaciones de cumplimiento.</p>
    <div className={styles.archiveFilters}>
      <label>Buscar en el contenido visible<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Comité PYMES, contexto, decisión…" /></label>
      <label>Clase de información<select value={kind} onChange={(event) => setKind(event.target.value)}>
        <option value="">Todas</option><option value="Contexto">Contexto</option><option value="Decisión propuesta">Decisiones propuestas</option><option value="Compromiso propuesto">Compromisos propuestos</option>
      </select></label>
    </div>
    <p className={styles.note} role="status">{visible.length} referencia(s) de {minutes.length} acta(s) autorizada(s). Búsqueda local sobre los registros recuperados, no búsqueda completa en la base de datos.</p>
    {loading && <p role="status">Consultando documentos institucionales…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && visible.length === 0 && <p className={styles.note}>No hay referencias que coincidan con estos filtros en los borradores consultados.</p>}
    <div className={styles.archiveList}>
      {visible.map((entry) => <article className={styles.panel} key={entry.key}>
        <p className={styles.eyebrow}>{entry.kind.toUpperCase()} · NO APROBADA</p>
        <p>{entry.text}</p>
        <p className={styles.provenance}>Fuente: {entry.source.code} · versión actual v{entry.source.version} · estado {entry.source.status} · {entry.source.title}</p>
        {entry.source.meeting && <p className={styles.note}>Convocatoria: {entry.source.meeting.name} · {entry.source.meeting.eventDate}</p>}
        <button type="button" className={styles.secondary} onClick={() => onOpen(entry.source.id)}>Abrir acta fuente →</button>
      </article>)}
    </div>
    <p className={styles.note}>Esta vista muestra la versión actual de cada acta, no reconstruye aún el contenido de versiones anteriores ni certifica decisiones. La evidencia digital proporciona contexto y trazabilidad, no una calificación de productividad o desempeño.</p>
  </section>;
}
