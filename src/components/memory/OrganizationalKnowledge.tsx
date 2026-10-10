import { knowledgeJourney, memoryDemo } from "@/lib/conecta/memory-demo-data";
import styles from "./MemoryDemo.module.css";

export function OrganizationalKnowledge({ onTrace }: { onTrace: () => void }) {
  const [result, learning, knowledge] = knowledgeJourney;
  return <>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>04 / MEMORIA QUE SE REUTILIZA</p><h2>Conocimiento organizacional</h2><p>Conservar lo aprendido requiere contexto, revisión y una decisión de validación.</p></div></div>
    <p className={styles.contextBand}>Continuidad de ACT-DEMO-001 · seguimiento posterior simulado. No se produce conocimiento automáticamente al cerrar un acta.</p>
    <ol className={styles.knowledge}>
      <li><span className={styles.eyebrow}>01 / RESULTADO</span><h3>{result.title}</h3><p>{result.body}</p><span className={styles.provenance}>{result.provenance}</span></li>
      <li><span className={styles.eyebrow}>02 / APRENDIZAJE</span><h3>{learning.body}</h3><p>Una interpretación del resultado que debe revisarse; todavía no equivale a conocimiento institucional validado.</p></li>
      <li className={styles.validation}><span className={styles.eyebrow}>03 / VALIDACIÓN INSTITUCIONAL</span><h3>{memoryDemo.validation}</h3><p>{memoryDemo.validationNote}</p></li>
      <li className={styles.knowledgeValue}><span className={styles.eyebrow}>04 / CONOCIMIENTO CONSERVADO</span><h3>{knowledge.body}</h3><p>Alcance: captura de información financiera durante el ciclo del proyecto. No es una regla universal ni una evaluación de personas.</p><span className={styles.provenance}>{knowledge.provenance} · formulación demostrativa</span><p className={styles.mono}>{knowledge.id} ← {learning.id} ← {result.id}</p></li>
      <li><span className={styles.eyebrow}>05 / REUTILIZACIÓN PROPUESTA</span><h3>No empezar de cero</h3><p>{memoryDemo.reuse}</p><span className={styles.badge}>Aplicación futura · no ejecutada</span></li>
    </ol><button className={styles.secondary} onClick={onTrace}>← Revisar la procedencia de este conocimiento</button>
  </>;
}
