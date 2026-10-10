import { demoInvitation, eventKinds, initialMinuteDraft } from "@/lib/conecta/memory-demo-data";
import type { MinuteDraft } from "@/lib/conecta/memory-demo-types";
import styles from "./MemoryDemo.module.css";

export function MemoryCapture({ draft, onChange, onContinue }: { draft: MinuteDraft; onChange: (draft: MinuteDraft) => void; onContinue: () => void }) {
  function linkInvitation() {
    onChange({ ...draft, linked: true, participants: draft.participants.map((person) => ({ ...person, inherited: person.id.startsWith("PER-DEMO-") })), subject: demoInvitation.name, date: demoInvitation.event_date, start: demoInvitation.start_time, modality: demoInvitation.modality, place: demoInvitation.address, agenda: [...demoInvitation.topics] });
  }
  if (draft.stage !== "Borrador") return <section className={styles.panel}><h2>Acta en ciclo demostrativo</h2><p>El registro permanece bloqueado para no reescribirlo durante la simulación. No se implementa versionamiento real.</p><button className={styles.primary} onClick={onContinue}>Consultar acta</button></section>;
  return <><div className={styles.sectionHead}><div><p className={styles.eyebrow}>ORIGEN / CAPTURA INSTITUCIONAL</p><h2>Registrar acontecimiento</h2><p>El usuario aporta contexto; CONECTA conserva la identidad y las relaciones.</p></div></div>
    <fieldset className={styles.panel}><legend>Tipo de acontecimiento</legend><div className={styles.kindGrid}>{eventKinds.map((kind) => <label key={kind}><input type="radio" name="event-kind" checked={draft.kind === kind} onChange={() => onChange({ ...initialMinuteDraft, kind })} /> {kind}</label>)}</div></fieldset>
    {draft.kind === "Reunión" && <section className={styles.panel}><h3>Vincular convocatoria existente</h3><p>{demoInvitation.name} · 04 OCT 2026</p><p className={styles.mono}>{demoInvitation.reference} → {demoInvitation.id}</p><p className={styles.note}>Referencia visual de la convocatoria del mismo acontecimiento. No se crea una segunda reunión.</p><button className={styles.secondary} disabled={draft.linked} onClick={linkInvitation}>{draft.linked ? "Convocatoria DEMO vinculada" : "Vincular convocatoria DEMO"}</button></section>}
    <form className={styles.panel} onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
      <p className={styles.provenance}>{draft.linked ? "HEREDADO DE CONVOCATORIA · asunto, fecha y hora prevista" : "REGISTRO DEL ACONTECIMIENTO"}</p>
      <div className={styles.formGrid}><label>Nombre / asunto<input required value={draft.subject} readOnly={draft.linked} onChange={(e) => onChange({ ...draft, subject: e.target.value })} /></label><label>Proceso / área<input required value={draft.process} onChange={(e) => onChange({ ...draft, process: e.target.value })} /></label><label>Fecha<input required type="date" value={draft.date} readOnly={draft.linked} onChange={(e) => onChange({ ...draft, date: e.target.value })} /></label><label>Hora de inicio prevista<input required type="time" value={draft.start} readOnly={draft.linked} onChange={(e) => onChange({ ...draft, start: e.target.value })} /></label></div>
      <p className={styles.note}>Identidad asignada por CONECTA: {draft.linked ? "EVT-DEMO-001" : "EVT-DEMO-002"}. Sin campo de código manual.</p>
      {draft.kind !== "Reunión" && <p className={styles.note}>Este acontecimiento no requiere convocatoria. El acta es un instrumento opcional de documentación, no una condición para que exista memoria.</p>}
      <button className={styles.primary} type="submit">{draft.kind === "Reunión" ? "Elaborar acta institucional" : "Documentar con acta institucional · opcional"} →</button>
    </form>
  </>;
}
