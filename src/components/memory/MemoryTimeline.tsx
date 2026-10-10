import { useState } from "react";
import { formatMemoryDate, memoryNodes } from "@/lib/conecta/memory-demo-data";
import styles from "./MemoryDemo.module.css";

export function MemoryTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const normalized = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = memoryNodes.filter((node) => normalized(`${node.title} ${node.body} ${node.kind} ${node.id}`).includes(normalized(query.trim())));
  return <>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>01 / RECORRIDO INSTITUCIONAL</p><h2>Línea de Memoria</h2><p>Un acontecimiento. Sus decisiones. El conocimiento que deja.</p></div><div className={styles.search}><label htmlFor="memory-search">Buscar en la memoria institucional</label><input id="memory-search" type="search" placeholder="Buscar en la memoria institucional..." value={query} onChange={(event) => setQuery(event.target.value)} /><span role="status">{filtered.length} registros sintéticos</span></div></div>
    <div className={styles.contextBand}>Grupo Análisis & Consultorías <span> / </span> Gestión Financiera <span> / </span> Octubre 2026 · seguimiento posterior simulado</div>
    <ol className={styles.timeline}>{filtered.map((node) => <li key={node.id}>
      <time dateTime={node.date}>{formatMemoryDate(node.date)}</time>
      <button type="button" className={styles.timelineCard} onClick={() => onSelect(node.id)}><span className={styles.row}><span className={styles.badge}>{node.kind}</span><span className={styles.mono}>{node.id}</span></span><h3>{node.title}</h3><p>{node.body}</p><span className={styles.row}><span className={styles.provenance}>{node.provenance}</span><span>{node.status ?? "Vinculado al acontecimiento"} <span aria-hidden="true">↗</span></span></span></button>
    </li>)}</ol>
    {filtered.length === 0 && <div className={styles.empty}><h3>No hay coincidencias en este escenario</h3><p>Prueba con decisión, financiero o aprendizaje.</p><button className={styles.secondary} onClick={() => setQuery("")}>Limpiar búsqueda</button></div>}
  </>;
}
