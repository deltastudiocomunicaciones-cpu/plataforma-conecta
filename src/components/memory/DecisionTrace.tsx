import { decisionTrace, memoryDemo } from "@/lib/conecta/memory-demo-data";
import styles from "./MemoryDemo.module.css";

export function DecisionTrace({ onKnowledge }: { onKnowledge: () => void }) {
  return <>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>03 / RECONSTRUCCIÓN ESTRUCTURADA</p><h2>¿Por qué se tomó esta decisión?</h2><p>Del contexto a las consecuencias, con cada vínculo a la vista.</p></div><span className={styles.badge}>DEC-DEMO-001</span></div>
    <div className={styles.traceIntro}><span className={styles.provenance}>Derivado por sistema · relaciones del escenario</span><p>Esta vista ordena los registros sintéticos del acontecimiento {memoryDemo.meetingEventId}. No es una respuesta de IA ni una prueba de causalidad independiente.</p></div>
    <p className={styles.contextBand}>Origen: convocatoria CNV-DEMO-001 → reunión EVT-DEMO-001 → acta ACT-DEMO-001. Seguimiento del 07–25 oct: proyección sintética, no hechos observados.</p>
    <ol className={styles.trace}>{decisionTrace.map((node, index) => <li key={node.id}><article className={node.kind === "Decisión" ? styles.decisionNode : styles.traceNode}><span className={styles.eyebrow}>0{index + 1} / {index === 0 ? "Contexto · Evento" : node.kind}</span><h3>{node.title}</h3><p>{node.body}</p><span className={styles.provenance}>{node.provenance}</span><span className={styles.mono}>{node.id}</span></article>{index < decisionTrace.length - 1 && <div className={styles.connector}><span aria-hidden="true">↓</span>{node.relation}</div>}</li>)}</ol>
    <div className={styles.next}><div><h3>La decisión no termina en el acta</h3><p>El resultado abre una pregunta de aprendizaje y una instancia de validación.</p></div><button className={styles.primary} onClick={onKnowledge}>Explorar el conocimiento conservado <span aria-hidden="true">→</span></button></div>
  </>;
}
