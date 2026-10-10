import { minuteStages } from "@/lib/conecta/memory-demo-data";
import type { MinuteStage } from "@/lib/conecta/memory-demo-types";
import styles from "./MemoryDemo.module.css";

export function MinuteLifecycle({ stage, onChange }: { stage: MinuteStage; onChange: (stage: MinuteStage) => void }) {
  const index = minuteStages.indexOf(stage);
  return <section className={styles.lifecycle}><h3>Ciclo demostrativo</h3><ol>{minuteStages.map((item) => <li key={item} aria-current={stage === item ? "step" : undefined}>{item}{item === "Aprobada" ? " · DEMO" : ""}</li>)}</ol><p>Las revisiones preservan la historia del registro. Aquí se muestra el principio; no existe versionamiento real ni firma electrónica.</p><p className={styles.note}>Revisión de sesión · sin autoridad de aprobación productiva.</p>{index < minuteStages.length - 1 && <button className={styles.secondary} onClick={() => onChange(minuteStages[index + 1])}>Simular: {minuteStages[index + 1]} · DEMO</button>}</section>;
}
