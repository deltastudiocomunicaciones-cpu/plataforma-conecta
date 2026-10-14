import styles from "./MemoryDemo.module.css";

const lifecycle = [
  "Creación del borrador",
  "Elaboración y revisión",
  "Aprobación por autoridad designada",
  "Cierre y archivo institucional",
];

export function MinuteLifecycle() {
  return <section className={styles.lifecycle}><h3>Ciclo documental propuesto</h3><ol>{lifecycle.map((item, index) => <li key={item} aria-current={index === 0 ? "step" : undefined}>{item}{index > 0 ? " · pendiente" : " · DEMO"}</li>)}</ol><p>Esta secuencia explica el gobierno documental previsto. No ejecuta una revisión, aprobación, cierre ni archivo reales.</p><p className={styles.note}>Sin persistencia, autoridad designada, firma ni versionamiento funcional.</p></section>;
}
