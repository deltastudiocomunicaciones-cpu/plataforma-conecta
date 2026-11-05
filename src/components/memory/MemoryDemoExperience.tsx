"use client";

import { useCallback, useEffect, useState } from "react";
import { ConectaNavigation } from "@/components/ConectaNavigation";
import { InstitutionalConnections } from "@/components/InstitutionalConnections";
import { MemoryTimeline } from "./MemoryTimeline";
import { MemoryRecord } from "./MemoryRecord";
import { DecisionTrace } from "./DecisionTrace";
import { OrganizationalKnowledge } from "./OrganizationalKnowledge";
import { MemoryDesk } from "./MemoryDesk";
import { MemoryCapture } from "./MemoryCapture";
import { InstitutionalMinuteEditor } from "./InstitutionalMinuteEditor";
import { MemoryMinutes } from "./MemoryMinutes";
import { MemoryArchive } from "./MemoryArchive";
import { initialMinuteDraft } from "@/lib/conecta/memory-demo-data";
import { MEMORY_STORE_KEY, decodeMemoryBackup, serializeMemoryBackup, upsertMemoryDocument } from "@/lib/conecta/memory-local-store";
import type { MemoryMinuteDocument, MinuteDraft } from "@/lib/conecta/memory-demo-types";
import type { OrganizationalUnit } from "@/lib/conecta/organizational-catalog";
import styles from "./MemoryDemo.module.css";
import { draftFromInstitutionalMinute, getInstitutionalMinute, listInstitutionalMinutes, listInstitutionalMeetings, saveInstitutionalMinute, type InstitutionalMinute, type InstitutionalMeeting } from "@/lib/conecta/institutional-minutes";

type MemoryArea = "production" | "archive" | "intelligence";
export function MemoryDemoExperience({ organizationalUnits }: { organizationalUnits: OrganizationalUnit[] }) {
  const [area, setArea] = useState<MemoryArea>("production");
  const [view, setView] = useState(-1);
  const [institutionalMode, setInstitutionalMode] = useState(false);
  const [draft, setDraft] = useState<MinuteDraft>(initialMinuteDraft);
  const [documents, setDocuments] = useState<MemoryMinuteDocument[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [selectedId, setSelectedId] = useState("EVT-DEMO-001");
  const [storageMessage, setStorageMessage] = useState("Cargando borradores locales…");
  const [saveFeedback, setSaveFeedback] = useState<"idle" | "saved" | "dirty" | "error">("idle");
  const [institutionalMinutes, setInstitutionalMinutes] = useState<InstitutionalMinute[]>([]);
  const [institutionalLoading, setInstitutionalLoading] = useState(false);
  const [institutionalError, setInstitutionalError] = useState("");
  const [institutionalBusy, setInstitutionalBusy] = useState(false);
  const [institutionalMeetings, setInstitutionalMeetings] = useState<InstitutionalMeeting[]>([]);
  const [meetingsBusy, setMeetingsBusy] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");
  const [meetingEventId, setMeetingEventId] = useState<string | null>(null);
  const [institutionalFeedback, setInstitutionalFeedback] = useState<{ kind: "success" | "error" | "conflict"; message: string; code?: string; version?: number } | null>(null);
  const [institutionalCurrent, setInstitutionalCurrent] = useState<{ id: string; version: number } | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(MEMORY_STORE_KEY);
        if (!raw) { setStorageReady(true); setStorageMessage("Almacenamiento local disponible · aún no hay borradores guardados."); return; }
        const docs = decodeMemoryBackup(raw);
        setDocuments(docs);
        setStorageReady(true);
        setStorageMessage("Borradores recuperados de este navegador.");
      } catch { setStorageMessage("No se pudo leer el almacenamiento local. El contenido existente se conserva; exporta o revisa los datos antes de continuar."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const refreshInstitutional = useCallback(async () => {
    setInstitutionalLoading(true); setInstitutionalError("");
    try { setInstitutionalMinutes(await listInstitutionalMinutes()); }
    catch (error) { setInstitutionalError(error instanceof Error ? error.message : "No se pudieron consultar las actas institucionales."); }
    finally { setInstitutionalLoading(false); }
  }, []);
  const refreshMeetings = useCallback(async () => {
    setMeetingsBusy(true); setMeetingsError("");
    try { setInstitutionalMeetings(await listInstitutionalMeetings()); }
    catch (error) { setMeetingsError(error instanceof Error ? error.message : "No se pudieron consultar las convocatorias."); }
    finally { setMeetingsBusy(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshMeetings(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMeetings]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshInstitutional(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshInstitutional]);
  function navigate(next: number) {
    setView(next); setArea(next < 0 ? "production" : "intelligence");
    requestAnimationFrame(() => document.getElementById("memory-content")?.focus());
  }
  function saveDraft() {
    if (!storageReady) { setSaveFeedback("error"); setStorageMessage("Guardado pausado para evitar reemplazar datos locales dañados o no leídos."); return; }
    const now = new Date().toISOString();
    const id = activeId || `ACT-DEMO-${crypto.randomUUID()}`;
    const previous = documents.find((document) => document.id === id);
    const document: MemoryMinuteDocument = { id, code: `ACT-DEMO-${id.slice(-8)}`, draft: structuredClone(draft), createdAt: previous?.createdAt ?? now, updatedAt: now, demoVersion: 1, provenance: "DEMO_LOCAL" };
    try {
      const next = upsertMemoryDocument(documents, document);
      window.localStorage.setItem(MEMORY_STORE_KEY, serializeMemoryBackup(next));
      setDocuments(next); setActiveId(id); setSaveFeedback("saved"); setStorageMessage("Borrador guardado en este navegador · no sincronizado con Supabase.");
    } catch { setSaveFeedback("error"); setStorageMessage("No se pudo guardar (permiso o cuota del navegador). El borrador sigue abierto en esta página."); }
  }
  function openDocument(id: string) {
    const document = documents.find((item) => item.id === id);
    if (!document) return;
    setInstitutionalMode(false); setDraft(structuredClone(document.draft)); setActiveId(id); setSaveFeedback("saved"); setArea("production"); setView(-2);
  }
  function startInstitutionalMinute() {
    const clean: MinuteDraft = {
      ...structuredClone(initialMinuteDraft),
      subject: "", organization: "", process: "", date: "", start: "",
      agenda: [], objective: "", narrative: "", convener: "", institutionalResponsible: "",
      unitId: "", participants: [],
    };
    setInstitutionalMode(true);
    setDraft(clean); setActiveId(""); setInstitutionalCurrent(null); setMeetingEventId(null);
    setInstitutionalFeedback(null); setSaveFeedback("idle"); setArea("production"); setView(-2);
  }
  async function openInstitutionalMinute(id: string) {
    setInstitutionalError("");
    try {
      const minute = institutionalMinutes.find((item) => item.id === id);
      const loaded = minute ?? await getInstitutionalMinute(id);
      const value = draftFromInstitutionalMinute(loaded);
      if (!value) throw new Error("El contenido institucional no tiene el formato de edición esperado; se conservó en el archivo sin cargarlo en el formulario.");
      setInstitutionalMode(true); setDraft(structuredClone(value)); setInstitutionalCurrent({ id: loaded.id, version: loaded.version }); setMeetingEventId(loaded.meetingEventId);
      setInstitutionalFeedback(null); setSaveFeedback("idle"); setArea("production"); setView(-2);
    } catch (error) { setInstitutionalError(error instanceof Error ? error.message : "No se pudo abrir el acta institucional."); }
  }
  async function saveInstitutional() {
    if (institutionalBusy) return;
    setInstitutionalBusy(true); setInstitutionalFeedback(null);
    try {
      const saved = await saveInstitutionalMinute({ id: institutionalCurrent?.id, expectedVersion: institutionalCurrent?.version ?? null, meetingEventId, draft: structuredClone(draft) });
      setInstitutionalCurrent({ id: saved.id, version: saved.version });
      setInstitutionalFeedback({ kind: "success", message: "Guardado confirmado por Supabase. Sesión autenticada; documento en borrador.", code: saved.code, version: saved.version });
      await refreshInstitutional();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar. El contenido del formulario sigue abierto.";
      const conflict = /version|versión|conflict|concurr|expected/i.test(message);
      setInstitutionalFeedback({ kind: conflict ? "conflict" : "error", message: conflict ? `${message} No se aplicaron cambios; actualiza el archivo y vuelve a abrir la versión vigente antes de continuar.` : message });
    } finally { setInstitutionalBusy(false); }
  }
  function exportBackup() {
    const blob = new Blob([serializeMemoryBackup(documents)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a");
    anchor.href = url; anchor.download = "conecta-memoria-demo-respaldo.json"; anchor.click(); URL.revokeObjectURL(url);
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("El respaldo supera el límite de 2 MB.");
      const imported = decodeMemoryBackup(await file.text());
      const next = imported.reduce((all, item) => upsertMemoryDocument(all, item), documents);
      window.localStorage.setItem(MEMORY_STORE_KEY, serializeMemoryBackup(next)); setDocuments(next);
      setStorageMessage(`${imported.length} borrador(es) DEMO importado(s) y combinados por identificador.`);
    } catch (error) { setStorageMessage(error instanceof Error ? error.message : "No se pudo importar el respaldo."); }
  }
  return <div className={styles.shell}>
    <header className={`org-hero org-hero--institutional ${styles.header}`}><ConectaNavigation /></header>
    <main className={styles.main}>
      <div className={styles.intro}><div><p className={styles.eyebrow}>CONECTA / CONOCIMIENTO ORGANIZACIONAL</p><h1>Memoria Viva</h1><p className={styles.subtitle}>Conocimiento institucional trazable</p></div><span className={styles.demo}>DEMO local + archivo institucional RLS</span></div>
      <p className={styles.notice} role="status">DEMO — Guardado en este navegador. No constituye archivo institucional ni sincronización en Supabase. {storageMessage}</p>
      <div className={styles.toolbar}><button type="button" className={styles.secondary} onClick={exportBackup} disabled={!documents.length}>Exportar respaldo JSON</button><label className={styles.secondary}>Importar respaldo JSON<input type="file" accept="application/json,.json" hidden onChange={(event) => { void importBackup(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div>
      <InstitutionalConnections />
      <nav className={styles.steps} aria-label="Áreas de Memoria Viva"><button type="button" aria-current={area === "production" ? "page" : undefined} onClick={() => setArea("production")}><span>01</span>Producción documental</button><button type="button" aria-current={area === "archive" ? "page" : undefined} onClick={() => setArea("archive")}><span>02</span>Archivo institucional</button><button type="button" aria-current={area === "intelligence" ? "page" : undefined} onClick={() => setArea("intelligence")}><span>03</span>Inteligencia documental</button></nav>
      {area === "production" && <nav className={styles.subnav} aria-label="Pasos de producción"><button type="button" aria-current={view === -1 ? "step" : undefined} onClick={() => { setInstitutionalMode(false); setView(-1); setActiveId(""); setInstitutionalCurrent(null); setMeetingEventId(null); setInstitutionalFeedback(null); setDraft(initialMinuteDraft); setSaveFeedback("idle"); }}>Mesa de Memoria</button><button type="button" aria-current={view === -2 && !institutionalMode ? "step" : undefined} onClick={() => { setInstitutionalMode(false); setView(-2); setActiveId(""); setInstitutionalCurrent(null); setMeetingEventId(null); setInstitutionalFeedback(null); setDraft(initialMinuteDraft); setSaveFeedback("idle"); }}>Nuevo borrador DEMO</button><button type="button" aria-current={view === -2 && institutionalMode ? "step" : undefined} onClick={startInstitutionalMinute}>Nueva acta institucional</button><button type="button" aria-current={view === -3 ? "step" : undefined} onClick={() => navigate(-3)}>Elaboración del acta</button><a className={styles.secondary} href="/templates/conecta-acta-v1-en-blanco.pdf" download>Formato institucional en blanco · PDF</a></nav>}
      {area === "intelligence" && <nav className={styles.subnav} aria-label="Vistas de inteligencia documental">{[0, 2, 3].map((index) => <button key={index} type="button" aria-current={view === index ? "step" : undefined} onClick={() => setView(index)}>{index === 0 ? "Línea de Memoria" : index === 2 ? "Relaciones y decisiones" : "Conocimiento organizacional"}</button>)}</nav>}
      <section id="memory-content" tabIndex={-1} className={styles.content} aria-label={area === "production" ? "Producción documental" : area === "archive" ? "Archivo institucional" : "Inteligencia documental"}>
        {area === "production" && view === -1 && <MemoryDesk onOpen={(destination) => navigate(({ capture: -2, trace: 2, timeline: 0, knowledge: 3 })[destination])} />}
        {area === "production" && view === -2 && institutionalMode && <InstitutionalMinuteEditor
          draft={draft}
          onChange={(next) => { setDraft(next); setInstitutionalFeedback(null); }}
          meetingEventId={meetingEventId}
          onMeetingEventChange={(id) => { setMeetingEventId(id); setInstitutionalFeedback(null); }}
          meetings={institutionalMeetings}
          meetingsBusy={meetingsBusy}
          meetingsError={meetingsError}
          onRefreshMeetings={() => { void refreshMeetings(); }}
          onSave={saveInstitutional}
          busy={institutionalBusy}
          feedback={institutionalFeedback}
          existingCode={institutionalMinutes.find((minute) => minute.id === institutionalCurrent?.id)?.code}
        />}
        {area === "production" && view === -2 && !institutionalMode && <MemoryCapture draft={draft} organizationalUnits={organizationalUnits} onChange={(next) => { setDraft(next); setSaveFeedback("dirty"); if (institutionalCurrent) setInstitutionalFeedback(null); }} onContinue={() => navigate(-3)} onSave={saveDraft} saveFeedback={saveFeedback} savedCode={documents.find((item) => item.id === activeId)?.code} onSaveInstitutional={saveInstitutional} institutionalBusy={institutionalBusy} institutionalFeedback={institutionalFeedback} institutionalMeetings={institutionalMeetings} meetingsBusy={meetingsBusy} meetingsError={meetingsError} meetingEventId={meetingEventId} onMeetingEventChange={setMeetingEventId} onRefreshMeetings={() => { void refreshMeetings(); }} />}
        {area === "production" && view === -3 && <MemoryMinutes draft={draft} onChange={(next) => { setDraft(next); setSaveFeedback("dirty"); if (institutionalCurrent) setInstitutionalFeedback(null); }} onFollow={() => navigate(2)} onSave={saveDraft} saveFeedback={saveFeedback} onSaveInstitutional={saveInstitutional} institutionalBusy={institutionalBusy} institutionalFeedback={institutionalFeedback} />}
        {area === "archive" && <MemoryArchive draft={draft} documents={documents} organizationalUnits={organizationalUnits} onOpen={openDocument} institutionalMinutes={institutionalMinutes} institutionalMeetings={institutionalMeetings} institutionalLoading={institutionalLoading} institutionalError={institutionalError} onRefreshInstitutional={() => { void refreshInstitutional(); }} onOpenInstitutional={(id) => { void openInstitutionalMinute(id); }} onNewInstitutional={startInstitutionalMinute} />}
        {area === "intelligence" && view === 0 && <><MemoryTimeline onSelect={(id) => { setSelectedId(id); setView(1); }} />{documents.length > 0 && <section className={styles.panel}><h3>Actas DEMO guardadas localmente</h3>{documents.map((doc) => <p key={doc.id}><button type="button" className={styles.secondary} onClick={() => openDocument(doc.id)}>{doc.code} · {doc.draft.subject || "Sin título"} · {doc.draft.date}</button></p>)}</section>}</>}
        {area === "intelligence" && view === 1 && <MemoryRecord selectedId={selectedId} onTrace={() => navigate(2)} />}
        {area === "intelligence" && view === 2 && <><DecisionTrace onKnowledge={() => navigate(3)} />{documents.map((doc) => <SavedIntelligence key={doc.id} document={doc} onOpen={() => openDocument(doc.id)} />)}</>}
        {area === "intelligence" && view === 3 && <OrganizationalKnowledge onTrace={() => navigate(2)} />}
      </section>
      <footer className={styles.footer}><strong>Trazabilidad, no vigilancia.</strong> La evidencia digital aporta contexto; no constituye por sí sola una calificación de productividad, desempeño o cumplimiento.</footer>
    </main>
  </div>;
}

function SavedIntelligence({ document, onOpen }: { document: MemoryMinuteDocument; onOpen: () => void }) {
  const { draft } = document;
  return <article className={styles.panel}><p className={styles.eyebrow}>INTELIGENCIA DOCUMENTAL · DEMO LOCAL · {document.code}</p><h3>{draft.subject || "Acta sin título"}</h3><p>{draft.date} · {draft.process} · no es registro institucional</p>
    <h4>Decisiones</h4><ul>{(draft.decisions.length ? draft.decisions.map((item) => item.text) : [draft.decision].filter(Boolean)).map((item, index) => <li key={index}>{item}</li>)}</ul>
    <h4>Compromisos y fechas</h4><ul>{(draft.commitments.length ? draft.commitments : draft.commitment ? [{ id: "legacy", text: draft.commitment, responsibleFunction: draft.responsibleId || "Identidad pendiente de verificar", due: draft.due }] : []).map((item) => <li key={item.id}>{item.text} · función responsable: {item.responsibleFunction || "Pendiente"} · vence: {item.due || "Sin fecha"}</li>)}</ul>
    <h4>Riesgos</h4><ul>{(draft.risks.length ? draft.risks.map((item) => item.text) : [draft.risk].filter(Boolean)).map((item, index) => <li key={index}>{item}</li>)}</ul>
    <button type="button" className={styles.secondary} onClick={onOpen}>Abrir acta de origen para edición →</button>
  </article>;
}
