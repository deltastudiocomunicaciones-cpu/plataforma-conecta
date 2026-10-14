"use client";

import { useState } from "react";
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
import type { OrganizationalUnit } from "@/lib/conecta/organizational-catalog";
import styles from "./MemoryDemo.module.css";

type MemoryArea = "production" | "archive" | "intelligence";
export function MemoryDemoExperience({ organizationalUnits }: { organizationalUnits: OrganizationalUnit[] }) {
  const [area, setArea] = useState<MemoryArea>("production");
  const [view, setView] = useState(-1);
  const [draft, setDraft] = useState(initialMinuteDraft);
  const [selectedId, setSelectedId] = useState("EVT-DEMO-001");
  function navigate(next: number) {
    setView(next);
    setArea(next < 0 ? "production" : "intelligence");
    requestAnimationFrame(() => document.getElementById("memory-content")?.focus());
  }
  return <div className={styles.shell}>
    <header className={`org-hero org-hero--institutional ${styles.header}`}><ConectaNavigation /></header>
    <main className={styles.main}>
      <div className={styles.intro}>
        <div><p className={styles.eyebrow}>CONECTA / CONOCIMIENTO ORGANIZACIONAL</p><h1>Memoria Viva</h1><p className={styles.subtitle}>Conocimiento institucional trazable</p></div>
        <span className={styles.demo}>Entorno demostrativo</span>
      </div>
      <p className={styles.notice}>DEMO · los cambios viven solo en esta página y se pierden al recargar. Sin directorio real, archivos, búsqueda remota, aprobación ni persistencia institucional.</p>
      <InstitutionalConnections />
      <nav className={styles.steps} aria-label="Áreas de Memoria Viva">
        <button type="button" aria-current={area === "production" ? "page" : undefined} onClick={() => setArea("production")}><span>01</span>Producción documental</button>
        <button type="button" aria-current={area === "archive" ? "page" : undefined} onClick={() => setArea("archive")}><span>02</span>Archivo institucional</button>
        <button type="button" aria-current={area === "intelligence" ? "page" : undefined} onClick={() => setArea("intelligence")}><span>03</span>Inteligencia documental</button>
      </nav>
      {area === "production" && <nav className={styles.subnav} aria-label="Pasos de producción">
        <button type="button" aria-current={view === -1 ? "step" : undefined} onClick={() => { setView(-1); }}>Mesa de Memoria</button>
        <button type="button" aria-current={view === -2 ? "step" : undefined} onClick={() => { setView(-2); }}>Nuevo borrador</button>
        <button type="button" aria-current={view === -3 ? "step" : undefined} onClick={() => { setView(-3); }}>Elaboración del acta</button>
        <a className={styles.secondary} href="/templates/conecta-acta-v1-en-blanco.pdf" download>Formato institucional en blanco · PDF</a>
      </nav>}
      {area === "intelligence" && <nav className={styles.subnav} aria-label="Vistas de inteligencia documental">{[0, 2, 3].map((index) => <button key={index} type="button" aria-current={view === index ? "step" : undefined} onClick={() => setView(index)}>{index === 0 ? "Línea de Memoria" : index === 2 ? "Relaciones y decisiones" : "Conocimiento organizacional"}</button>)}</nav>}
      <section id="memory-content" tabIndex={-1} className={styles.content} aria-label={area === "production" ? "Producción documental" : area === "archive" ? "Archivo institucional" : "Inteligencia documental"}>
        {area === "production" && view === -1 && <MemoryDesk onOpen={(destination) => navigate(({ capture: -2, trace: 2, timeline: 0, knowledge: 3 })[destination])} />}
        {area === "production" && view === -2 && <MemoryCapture draft={draft} organizationalUnits={organizationalUnits} onChange={setDraft} onContinue={() => navigate(-3)} />}
        {area === "production" && view === -3 && <MemoryMinutes draft={draft} onChange={setDraft} onFollow={() => navigate(2)} />}
        {area === "archive" && <MemoryArchive draft={draft} organizationalUnits={organizationalUnits} />}
        {area === "intelligence" && view === 0 && <MemoryTimeline onSelect={(id) => { setSelectedId(id); setView(1); }} />}
        {area === "intelligence" && view === 1 && <MemoryRecord selectedId={selectedId} onTrace={() => navigate(2)} />}
        {area === "intelligence" && view === 2 && <DecisionTrace onKnowledge={() => navigate(3)} />}
        {area === "intelligence" && view === 3 && <OrganizationalKnowledge onTrace={() => navigate(2)} />}
      </section>
      <footer className={styles.footer}><strong>Trazabilidad, no vigilancia.</strong> La evidencia digital aporta contexto; no constituye por sí sola una calificación de productividad, desempeño o cumplimiento.</footer>
    </main>
  </div>;
}
