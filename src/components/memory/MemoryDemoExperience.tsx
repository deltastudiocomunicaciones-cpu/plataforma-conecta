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
import { initialMinuteDraft } from "@/lib/conecta/memory-demo-data";
import styles from "./MemoryDemo.module.css";

const views = ["Línea de Memoria", "Ficha de Memoria", "Reconstrucción causal", "Conocimiento organizacional"] as const;
export function MemoryDemoExperience() {
  const [view, setView] = useState(-1);
  const [draft, setDraft] = useState(initialMinuteDraft);
  const [selectedId, setSelectedId] = useState("EVT-DEMO-001");
  function navigate(next: number) {
    setView(next);
    requestAnimationFrame(() => document.getElementById("memory-content")?.focus());
  }
  return <div className={styles.shell}>
    <header className={`org-hero org-hero--institutional ${styles.header}`}><ConectaNavigation /></header>
    <main className={styles.main}>
      <div className={styles.intro}>
        <div><p className={styles.eyebrow}>CONECTA / CONOCIMIENTO ORGANIZACIONAL</p><h1>Memoria Viva</h1><p className={styles.subtitle}>Conocimiento institucional trazable</p></div>
        <span className={styles.demo}>Entorno demostrativo</span>
      </div>
      <p className={styles.notice}>Entorno demostrativo · los cambios no se almacenan. Sin archivos reales ni IA operativa.</p>
      <InstitutionalConnections />
      <div className={styles.toolbar}><button className={styles.secondary} onClick={() => navigate(-1)}>Mesa de Memoria</button><button className={styles.primary} onClick={() => navigate(-2)}>+ Registrar acontecimiento</button></div>
      <nav className={styles.steps} aria-label="Recorrido de Memoria Viva">{views.map((label, index) => <button key={label} type="button" aria-current={view === index ? "step" : undefined} onClick={() => navigate(index)}><span>0{index + 1}</span>{label}</button>)}</nav>
      <section id="memory-content" tabIndex={-1} className={styles.content} aria-label={view < 0 ? "Mesa y captura institucional" : views[view]}>
        {view === -1 && <MemoryDesk onOpen={(destination) => navigate(({ capture: -2, trace: 2, timeline: 0, knowledge: 3 })[destination])} />}
        {view === -2 && <MemoryCapture draft={draft} onChange={setDraft} onContinue={() => navigate(-3)} />}
        {view === -3 && <MemoryMinutes draft={draft} onChange={setDraft} onFollow={() => navigate(2)} />}
        {view === 0 && <MemoryTimeline onSelect={(id) => { setSelectedId(id); navigate(1); }} />}
        {view === 1 && <MemoryRecord selectedId={selectedId} onTrace={() => navigate(2)} />}
        {view === 2 && <DecisionTrace onKnowledge={() => navigate(3)} />}
        {view === 3 && <OrganizationalKnowledge onTrace={() => navigate(2)} />}
      </section>
      <footer className={styles.footer}><strong>Trazabilidad, no vigilancia.</strong> La evidencia digital aporta contexto; no constituye por sí sola una calificación de productividad, desempeño o cumplimiento.</footer>
    </main>
  </div>;
}
