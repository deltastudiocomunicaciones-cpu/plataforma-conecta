"use client";

import { useState } from "react";
import { getInstitutionalHistory, type InstitutionalHistory, type InstitutionalMinute } from "@/lib/conecta/institutional-minutes";
import styles from "./MemoryDemo.module.css";

export function InstitutionalMinutesPanel({ minutes, loading, error, onRefresh, onOpen, onNew }: {
  minutes: InstitutionalMinute[]; loading: boolean; error: string; onRefresh: () => void;
  onOpen: (id: string) => void; onNew: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [history, setHistory] = useState<InstitutionalHistory | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const selectedId = minutes.some((minute) => minute.id === selected) ? selected : (minutes[0]?.id ?? "");
  async function loadHistory(id: string) {
    setSelected(id); setHistory(null); setHistoryError(""); setHistoryBusy(true);
    try { setHistory(await getInstitutionalHistory(id)); }
    catch (cause) { setHistoryError(cause instanceof Error ? cause.message : "No se pudo consultar el historial."); }
    finally { setHistoryBusy(false); }
  }
  const current = minutes.find((minute) => minute.id === selectedId);
  return <section className={styles.panel} aria-label="Actas institucionales">
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>SUPABASE · SESIÓN AUTENTICADA · RLS</p><h2>Actas institucionales</h2><p>Registros recuperados con permisos de tu sesión. El estado disponible es borrador.</p></div><button type="button" className={styles.primary} onClick={onNew}>Crear acta institucional</button></div>
    <div className={styles.toolbar}><button type="button" className={styles.secondary} onClick={onRefresh} disabled={loading}>{loading ? "Actualizando…" : "Actualizar archivo"}</button>{loading && <span role="status">Consultando actas autorizadas…</span>}</div>
    {error && <p role="alert" className={styles.note}>{error}</p>}
    {!loading && !error && !minutes.length && <p className={styles.note}>No hay actas institucionales visibles para esta sesión.</p>}
    {minutes.length > 0 && <div className={styles.archiveLayout}>
      <ul className={styles.archiveList}>{minutes.map((minute) => <li key={minute.id}><button type="button" className={styles.archiveItem} aria-pressed={selected === minute.id} onClick={() => void loadHistory(minute.id)}><span className={styles.row}><code>{minute.code || minute.id}</code><span className={styles.badge}>BORRADOR · v{minute.version}</span></span><strong>{minute.title}</strong><span>{minute.status} · actualizado {minute.updatedAt || minute.createdAt}</span></button></li>)}</ul>
      {current && <article className={styles.panel} aria-live="polite"><p className={styles.eyebrow}>REGISTRO INSTITUCIONAL · {current.status.toUpperCase()}</p><h3>{current.title}</h3><dl className={styles.metadata}><div><dt>Código institucional</dt><dd><code>{current.code || "No devuelto por el servidor"}</code></dd></div><div><dt>UUID</dt><dd><code>{current.id}</code></dd></div><div><dt>Versión actual</dt><dd>{current.version}</dd></div><div><dt>Evento institucional relacionado</dt><dd>{current.meetingEventId ? <code>{current.meetingEventId}</code> : "Sin evento vinculado"}</dd></div></dl>
        <button type="button" className={styles.secondary} onClick={() => onOpen(current.id)}>Abrir y continuar edición →</button>
        <h4>Historial de versiones y auditoría</h4>{historyBusy && <p role="status">Consultando historial…</p>}{historyError && <p role="alert">{historyError}</p>}
        {history && <><h5>Versiones</h5>{history.versions.length ? <ul>{history.versions.map((item, i) => <li key={String(item.id ?? i)}>v{String(item.version ?? item.version_number ?? "?")} · {String(item.created_at ?? "")}</li>)}</ul> : <p>No se devolvieron versiones.</p>}<h5>Eventos</h5>{history.events.length ? <ul>{history.events.map((item, i) => <li key={String(item.id ?? i)}>{String(item.event_type ?? item.action ?? "Evento")} · {String(item.created_at ?? "")}</li>)}</ul> : <p>No se devolvieron eventos.</p>}</>}
      </article>}
    </div>}
  </section>;
}
