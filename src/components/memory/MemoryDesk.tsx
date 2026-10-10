import { deskWork } from "@/lib/conecta/memory-demo-data";
import styles from "./MemoryDemo.module.css";

export function MemoryDesk({ onOpen }: { onOpen: (destination: "capture" | "trace" | "timeline" | "knowledge") => void }) {
  return <><div className={styles.sectionHead}><div><p className={styles.eyebrow}>ACTIVIDAD → MEMORIA → CONOCIMIENTO</p><h2>Mesa de Memoria</h2><p>Grupo Análisis &amp; Consultorías · escenario de Gestión Financiera.</p></div><button className={styles.primary} onClick={() => onOpen("capture")}>+ Registrar acontecimiento</button></div>
    <p className={styles.note}>Una capacidad transversal para Dirección, PYMES, Innovación y los demás procesos. Las reuniones son un origen posible; no toda memoria requiere convocatoria o acta.</p>
    <div className={styles.deskGrid}>{deskWork.map((item) => <button className={styles.timelineCard} key={item.id} onClick={() => onOpen(item.destination)}><span className={styles.mono}>{item.id}</span><h3>{item.title}</h3><p>{item.detail}</p><span className={styles.provenance}>Abrir escenario →</span></button>)}</div>
    <div className={styles.next}><div><h3>Primero documentar. Después comprender.</h3><p>Convocar → celebrar → documentar → decidir → asignar → seguir → evaluar → aprender → conservar.</p><p className={styles.note}>El seguimiento del 07–25 oct es una proyección sintética. No acredita resultados ocurridos ni se genera al completar el acta.</p></div></div>
  </>;
}
