"use client";

import { useEffect, useState } from "react";
import { ConectaNavigation } from "@/components/ConectaNavigation";
import { InstitutionalConnections } from "@/components/InstitutionalConnections";
import { MemoryTimeline } from "./MemoryTimeline";
import { MemoryRecord } from "./MemoryRecord";
import { DecisionTrace } from "./DecisionTrace";
import { OrganizationalKnowledge } from "./OrganizationalKnowledge";
import { MemoryDesk } from "./MemoryDesk";
import { MemoryCapture } from "./MemoryCapture";
import { MemoryMinutes } from "./MemoryMinutes";
import { MemoryArchive } from "./MemoryArchive";
import { initialMinuteDraft } from "@/lib/conecta/memory-demo-data";
import { MEMORY_STORE_KEY, decodeMemoryBackup, serializeMemoryBackup, upsertMemoryDocument } from "@/lib/conecta/memory-local-store";
import type { MemoryMinuteDocument, MinuteDraft } from "@/lib/conecta/memory-demo-types";
import type { OrganizationalUnit } from "@/lib/conecta/organizational-catalog";
import styles from "./MemoryDemo.module.css";

type MemoryArea = "production" | "archive" | "intelligence";
export function MemoryDemoExperience({ organizationalUnits }: { organizationalUnits: OrganizationalUnit[] }) {
  const [area, setArea] = useState<MemoryArea>("production");
  const [view, setView] = useState(-1);
  const [draft, setDraft] = useState<MinuteDraft>(initialMinuteDraft);
  const [documents, setDocuments] = useState<MemoryMinuteDocument[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [selectedId, setSelectedId] = useState("EVT-DEMO-001");
  const [storageMessage, setStorageMessage] = useState("Cargando borradores locales…");
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
  function navigate(next: number) {
    setView(next); setArea(next < 0 ? "production" : "intelligence");
    requestAnimationFrame(() => document.getElementById("memory-content")?.focus());
  }
  function saveDraft() {
    if (!storageReady) { setStorageMessage("Guardado pausado para evitar reemplazar datos locales dañados o no leídos."); return; }
    const now = new Date().toISOString();
    const id = activeId || `ACT-DEMO-${crypto.randomUUID()}`;
    const previous = documents.find((document) => document.id === id);
    const document: MemoryMinuteDocument = { id, code: `ACT-DEMO-${id.slice(-8)}`, draft: structuredClone(draft), createdAt: previous?.createdAt ?? now, updatedAt: now, demoVersion: 1, provenance: "DEMO_LOCAL" };
    try {
      const next = upsertMemoryDocument(documents, document);
      window.localStorage.setItem(MEMORY_STORE_KEY, serializeMemoryBackup(next));
      setDocuments(next); setActiveId(id); setStorageMessage("Borrador guardado en este navegador · no sincronizado con Supabase.");
    } catch { setStorageMessage("No se pudo guardar (permiso o cuota del navegador). El borrador sigue abierto en esta página."); }
  }
  function openDocument(id: string) {
    const document = documents.find((item) => item.id === id);
    if (!document) return;
    setDraft(structuredClone(document.draft)); setActiveId(id); setArea("production"); setView(-2);
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
      <div className={styles.intro}><div><p className={styles.eyebrow}>CONECTA / CONOCIMIENTO ORGANIZACIONAL</p><h1>Memoria Viva</h1><p className={styles.subtitle}>Conocimiento institucional trazable</p></div><span className={styles.demo}>Entorno demostrativo</span></div>
      <p className={styles.notice} role="status">DEMO — Guardado en este navegador. No constituye archivo institucional ni sincronización en Supabase. {storageMessage}</p>
      <div className={styles.toolbar}><button type="button" className={styles.secondary} onClick={exportBackup} disabled={!documents.length}>Exportar respaldo JSON</button><label className={styles.secondary}>Importar respaldo JSON<input type="file" accept="application/json,.json" hidden onChange={(event) => { void importBackup(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div>
      <InstitutionalConnections />
      <nav className={styles.steps} aria-label="Áreas de Memoria Viva"><button type="button" aria-current={area === "production" ? "page" : undefined} onClick={() => setArea("production")}><span>01</span>Producción documental</button><button type="button" aria-current={area === "archive" ? "page" : undefined} onClick={() => setArea("archive")}><span>02</span>Archivo institucional</button><button type="button" aria-current={area === "intelligence" ? "page" : undefined} onClick={() => setArea("intelligence")}><span>03</span>Inteligencia documental</button></nav>
      {area === "production" && <nav className={styles.subnav} aria-label="Pasos de producción"><button type="button" aria-current={view === -1 ? "step" : undefined} onClick={() => { setView(-1); setActiveId(""); setDraft(initialMinuteDraft); }}>Mesa de Memoria</button><button type="button" aria-current={view === -2 ? "step" : undefined} onClick={() => { setView(-2); setActiveId(""); setDraft(initialMinuteDraft); }}>Nuevo borrador</button><button type="button" aria-current={view === -3 ? "step" : undefined} onClick={() => navigate(-3)}>Elaboración del acta</button><a className={styles.secondary} href="/templates/conecta-acta-v1-en-blanco.pdf" download>Formato institucional en blanco · PDF</a></nav>}
      {area === "intelligence" && <nav className={styles.subnav} aria-label="Vistas de inteligencia documental">{[0, 2, 3].map((index) => <button key={index} type="button" aria-current={view === index ? "step" : undefined} onClick={() => setView(index)}>{index === 0 ? "Línea de Memoria" : index === 2 ? "Relaciones y decisiones" : "Conocimiento organizacional"}</button>)}</nav>}
      <section id="memory-content" tabIndex={-1} className={styles.content} aria-label={area === "production" ? "Producción documental" : area === "archive" ? "Archivo institucional" : "Inteligencia documental"}>
        {area === "production" && view === -1 && <MemoryDesk onOpen={(destination) => navigate(({ capture: -2, trace: 2, timeline: 0, knowledge: 3 })[destination])} />}
        {area === "production" && view === -2 && <MemoryCapture draft={draft} organizationalUnits={organizationalUnits} onChange={setDraft} onContinue={() => navigate(-3)} onSave={saveDraft} savedCode={documents.find((item) => item.id === activeId)?.code} />}
        {area === "production" && view === -3 && <MemoryMinutes draft={draft} onChange={setDraft} onFollow={() => navigate(2)} onSave={saveDraft} />}
        {area === "archive" && <MemoryArchive draft={draft} documents={documents} organizationalUnits={organizationalUnits} onOpen={openDocument} />}
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
