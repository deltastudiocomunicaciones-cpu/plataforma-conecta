"use client";

import { useMemo, useState } from "react";
import { getInstitutionalHistory, type InstitutionalHistory, type InstitutionalMinute, type InstitutionalMeeting } from "@/lib/conecta/institutional-minutes";
import styles from "./MemoryDemo.module.css";

export function InstitutionalMinutesPanel({ minutes, meetings = [], loading, error, onRefresh, onOpen, onNew }: {
  minutes: InstitutionalMinute[]; meetings?: InstitutionalMeeting[]; loading: boolean; error: string; onRefresh: () => void;
  onOpen: (id: string) => void; onNew: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  // Only authenticated RLS-scoped Supabase rows enter this index. Never DEMO records.
  const filteredMinutes = useMemo(() => minutes.filter((minute) => {
    const haystack = normalized([minute.code, minute.title, minute.id, minute.meetingEventId ?? ""].join(" "));
    const date = minute.createdAt.slice(0, 10);
    return (!query.trim() || haystack.includes(normalized(query.trim())))
      && (!status || minute.status === status)
      && (!from || date >= from)
      && (!to || date <= to);
  }), [minutes, query, status, from, to]);
  const [history, setHistory] = useState<InstitutionalHistory | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const selectedId = filteredMinutes.some((minute) => minute.id === selected) ? selected : (filteredMinutes[0]?.id ?? "");
  async function loadHistory(id: string) {
    setSelected(id); setHistory(null); setHistoryError(""); setHistoryBusy(true);
    try { setHistory(await getInstitutionalHistory(id)); }
    catch (cause) { setHistoryError(cause instanceof Error ? cause.message : "No se pudo consultar el historial."); }
    finally { setHistoryBusy(false); }
  }
  const current = filteredMinutes.find((minute) => minute.id === selectedId);
  const currentMeeting = meetings.find((meeting) => meeting.id === current?.meetingEventId);
  return <section className={styles.panel} aria-label="Actas institucionales">
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>SUPABASE · SESIÓN AUTENTICADA · RLS</p><h2>Actas institucionales</h2><p>Registros recuperados con permisos de tu sesión. El estado disponible es borrador.</p></div><button type="button" className={styles.primary} onClick={onNew}>Crear acta institucional</button></div>
    <section className={styles.panel} aria-label="Filtros del archivo institucional">
      <div className={styles.archiveFilters}>
        <label>Buscar por código, título, UUID o reunión<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ACT-B92E456B5218, asunto…" /></label>
        <label>Estado<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos los estados visibles</option><option value="borrador">Borrador</option></select></label>
        <label>Creada desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>Creada hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      </div>
      <p className={styles.note} role="status">{filteredMinutes.length} de {minutes.length} acta(s) institucional(es) autorizada(s). Consulta local sobre resultados de Supabase con RLS; no incluye DEMO.</p>
    </section>
    <div className={styles.toolbar}><button type="button" className={styles.secondary} onClick={onRefresh} disabled={loading}>{loading ? "Actualizando…" : "Actualizar archivo"}</button>{loading && <span role="status">Consultando actas autorizadas…</span>}</div>
    {error && <p role="alert" className={styles.note}>{error}</p>}
    {!loading && !error && !minutes.length && <p className={styles.note}>No hay actas institucionales visibles para esta sesión.</p>}
    {!loading && !error && minutes.length > 0 && !filteredMinutes.length && <p className={styles.note}>No hay actas coincidentes. Modifica los filtros.</p>}
    {filteredMinutes.length > 0 && <div className={styles.archiveLayout}>
      <ul className={styles.archiveList}>{filteredMinutes.map((minute) => <li key={minute.id}><button type="button" className={styles.archiveItem} aria-pressed={selected === minute.id} onClick={() => void loadHistory(minute.id)}><span className={styles.row}><code>{minute.code || minute.id}</code><span className={styles.badge}>BORRADOR · v{minute.version}</span></span><strong>{minute.title}</strong><span>{minute.status} · actualizado {minute.updatedAt || minute.createdAt}</span></button></li>)}</ul>
      {current && <article className={styles.panel} aria-live="polite"><p className={styles.eyebrow}>REGISTRO INSTITUCIONAL · {current.status.toUpperCase()}</p><h3>{current.title}</h3><dl className={styles.metadata}><div><dt>Código institucional</dt><dd><code>{current.code || "No devuelto por el servidor"}</code></dd></div><div><dt>UUID</dt><dd><code>{current.id}</code></dd></div><div><dt>Versión actual</dt><dd>{current.version}</dd></div><div><dt>Convocatoria institucional de origen</dt><dd>{current.meetingEventId ? <>{currentMeeting ? <><strong>{currentMeeting.name}</strong> · {currentMeeting.eventDate}<p className={styles.note}>Estado de convocatoria: {currentMeeting.status}</p></> : <span>Convocatoria vinculada · datos no disponibles en la lista actual</span>}<p><code>{current.meetingEventId}</code></p><a href="/convocatorias" className={styles.secondary}>Abrir módulo Convocatorias →</a></> : "Sin convocatoria vinculada"}</dd></div></dl>
        <button type="button" className={styles.secondary} onClick={() => onOpen(current.id)}>Abrir y continuar edición →</button>
        <h4>Historial de versiones y auditoría</h4>{historyBusy && <p role="status">Consultando historial…</p>}{historyError && <p role="alert">{historyError}</p>}
        {history && <><h5>Versiones</h5>{history.versions.length ? <ul>{history.versions.map((item, i) => <li key={String(item.id ?? i)}>v{String(item.version ?? item.version_number ?? "?")} · {String(item.created_at ?? "")}</li>)}</ul> : <p>No se devolvieron versiones.</p>}<h5>Eventos</h5>{history.events.length ? <ul>{history.events.map((item, i) => <li key={String(item.id ?? i)}>{String(item.event_type ?? item.action ?? "Evento")} · {String(item.created_at ?? "")}</li>)}</ul> : <p>No se devolvieron eventos.</p>}</>}
      </article>}
    </div>}
  </section>;
}
