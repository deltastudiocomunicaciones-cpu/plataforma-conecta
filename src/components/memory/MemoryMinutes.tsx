import { useState } from "react";
import { demoDirectory, demoInvitation, eventKinds, memoryDemo } from "@/lib/conecta/memory-demo-data";
import type { DemoParticipant, EventKind, MinuteDraft, ParticipationCondition } from "@/lib/conecta/memory-demo-types";
import { MinuteLifecycle } from "./MinuteLifecycle";
import styles from "./MemoryDemo.module.css";
import { downloadMinutePdf } from "@/lib/conecta/memory-minute-pdf";

function FieldOrigin({ linked, original, current }: { linked: boolean; original: string; current: string }) {
  return <small className={styles.note}>{linked ? <>HEREDADO DE CONVOCATORIA · previsto: {original} · {current === original ? "VALOR HEREDADO SIN AJUSTES" : "AJUSTADO EN ACTA"}</> : "REGISTRO DEL ACTA"}</small>;
}

export function MemoryMinutes({ draft, onChange, onFollow }: { draft: MinuteDraft; onChange: (draft: MinuteDraft) => void; onFollow: () => void }) {
  const [review, setReview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  async function exportPdf() {
    setExporting(true); setExportError("");
    try { await downloadMinutePdf(draft, demoDirectory, review); }
    catch { setExportError("No se pudo descargar el PDF. Intenta de nuevo."); }
    finally { setExporting(false); }
  }
  const suffix = draft.linked ? "001" : "002";
  const locked = review || draft.stage !== "Borrador";
  function field<K extends keyof MinuteDraft>(key: K, value: MinuteDraft[K]) { onChange({ ...draft, [key]: value }); }
  const author = demoDirectory.find((person) => person.id === draft.authorId);
  return <><div className={styles.sectionHead}><div><p className={styles.eyebrow}>REGISTRO DEL ACTA / {review ? "REVISIÓN" : "ELABORACIÓN"}</p><h2>Acta institucional</h2><p>{draft.organization} · {draft.process}</p></div><span className={styles.badge}>{draft.stage} · DEMO</span></div>
    <p className={styles.contextBand}>Identificador visible de presentación: ACT-DEMO-{suffix} → EVT-DEMO-{suffix} · no oficial · el borrador no tiene UUID persistente</p>
    <div className={styles.toolbar}><button className={styles.secondary} type="button" disabled={exporting} onClick={exportPdf}>{exporting ? "Preparando PDF…" : "Descargar PDF"}</button><small className={styles.note}>Documento de demostración · estado actual del acta</small></div>
    {exportError && <p role="alert">{exportError}</p>}
    <form onSubmit={(e) => { e.preventDefault(); setReview(true); requestAnimationFrame(() => document.getElementById("minute-review")?.focus()); }}>
    <fieldset disabled={locked} className={styles.editor}>
      <section className={styles.panel}>
        <h3>01 · Identificación y propósito</h3>
        <p className={styles.provenance}>CONTEXTO ORGANIZACIONAL · escenario DEMO</p>
        <div className={styles.formGrid}>
          <label>Organización<input required value={draft.organization} onChange={(e) => field("organization", e.target.value)} /></label>
          <label>Proceso / área<input required value={draft.process} onChange={(e) => field("process", e.target.value)} /></label>
        </div>
        <p className={styles.note}>La convocatoria conserva lo previsto; los campos siguientes documentan lo confirmado o ajustado en el acta.</p>
        <div className={styles.formGrid}>
          <label>Tipo de acontecimiento<select value={draft.kind} onChange={(e) => field("kind", e.target.value as EventKind)}>{eventKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
          {draft.kind === "Otro" && <label>Especifique el tipo de acontecimiento<input required value={draft.otherKind} onChange={(e) => field("otherKind", e.target.value)} /></label>}
          <div><label>Nombre / asunto<input required value={draft.subject} onChange={(e) => field("subject", e.target.value)} /></label><FieldOrigin linked={draft.linked} original={demoInvitation.name} current={draft.subject} /></div>
          <div><label>Fecha<input required type="date" value={draft.date} onChange={(e) => field("date", e.target.value)} /></label><FieldOrigin linked={draft.linked} original={demoInvitation.event_date} current={draft.date} /></div>
          <div><label>Hora inicio prevista<input required type="time" readOnly={draft.linked} value={draft.start} onChange={(e) => field("start", e.target.value)} /></label><small className={styles.note}>{draft.linked ? "HEREDADO DE CONVOCATORIA" : "PREVISIÓN · DEMO"}</small></div>
          <div><label>Hora inicio real<input type="time" value={draft.actualStart} onChange={(e) => field("actualStart", e.target.value)} /></label><small className={styles.note}>REGISTRO DEL ACTA</small></div>
          <div><label>Hora cierre real<input type="time" value={draft.end} onChange={(e) => field("end", e.target.value)} /></label><small className={styles.note}>REGISTRO DEL ACTA</small></div>
          <div><label>Modalidad<select value={draft.modality} onChange={(e) => field("modality", e.target.value)}>{["Presencial", "Virtual", "Híbrida", "Otra"].map((value) => <option key={value}>{value}</option>)}</select></label><FieldOrigin linked={draft.linked} original={demoInvitation.modality} current={draft.modality} /></div>
          {draft.modality === "Otra" && <label>Especifique la modalidad<input required value={draft.otherModality} onChange={(e) => field("otherModality", e.target.value)} /></label>}
          <div><label>Lugar / canal<input value={draft.place} onChange={(e) => field("place", e.target.value)} /></label><FieldOrigin linked={draft.linked} original={demoInvitation.address} current={draft.place} /></div>
        </div>
        <label className={styles.field}>Objetivo · información complementaria del acta<textarea required value={draft.objective} onChange={(e) => field("objective", e.target.value)} /></label>
        <p className={styles.note}>REGISTRO DEL ACTA · El contrato actual de Convocatorias no incluye un campo objetivo. Este contenido pertenece al acta.</p>
      </section>
      <section className={styles.panel}>
        <h3>02 · Participación</h3>
        <p>Datos DEMO / sintéticos. Convocatoria ≠ RSVP ≠ asistencia. Sin identidades productivas.</p>
        <p className={styles.note}>Convocatoria, RSVP y asistencia son datos distintos. Los seleccionados empiezan como convocados; aquí no se consulta RSVP ni se envía una invitación. Las modificaciones solo viven en esta sesión.</p>
        <div className={styles.participants}>{draft.participants.map((person, index) => {
          const update = (patch: Partial<DemoParticipant>) => field("participants", draft.participants.map((current) => current.id === person.id ? { ...current, ...patch } : current));
          return <div key={person.id}>
            <h4>Participante {index + 1} · DEMO</h4>
            <p className={styles.provenance}>{person.inherited ? "REFERENCIA DE CONVOCATORIA · fixture DEMO" : person.unit.startsWith("Invitado externo") ? "INVITADO EXTERNO · fixture DEMO" : "SELECCIÓN DE DIRECTORIO DEMO · instantánea"}</p>
            <label>Nombre — participante {index + 1}<input required value={person.name} onChange={(e) => update({ name: e.target.value })} /></label>
            <label>Cargo / rol — participante {index + 1}<input value={person.role} onChange={(e) => update({ role: e.target.value })} /></label>
            <p className={styles.note}>Unidad al seleccionar: {person.unit || "Sin unidad verificada"} · {person.id}</p>
            <label><input type="checkbox" checked={person.invited} disabled={person.inherited} onChange={(e) => update({ invited: e.target.checked, ...(person.condition === "Convocado" && !e.target.checked ? { condition: "Invitado" as const } : {}) })} /> Convocado — participante {index + 1}</label>
            <label>Asistencia registrada en esta sesión — participante {index + 1}<select value={person.condition} onChange={(e) => update({ condition: e.target.value as ParticipationCondition, ...(e.target.value === "Convocado" ? { invited: true } : {}) })}>{["Convocado", "Asistente", "Ausente", "Excusado", "Invitado"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <p className={styles.note}>RSVP: no consultado · no se infiere respuesta a partir de convocatoria, nombre ni asistencia.</p>
            <button type="button" className={styles.secondary} aria-label={`Eliminar participante ${index + 1}`} onClick={() => field("participants", draft.participants.filter((current) => current.id !== person.id))}>Eliminar participante</button>
          </div>;
        })}</div>
        <button type="button" className={styles.secondary} onClick={() => field("participants", [...draft.participants, { id: `INV-DEMO-${crypto.randomUUID()}`, name: "", role: "", unit: "Invitado externo · DEMO", unitId: "", condition: "Invitado", invited: false, inherited: false, rsvp: "" }])}>+ Añadir invitado externo · DEMO</button>
        <h4>Quórum / asistencia</h4>
        <p aria-live="polite">Convocados: {draft.participants.filter((person) => person.invited).length} · Asistentes: {draft.participants.filter((person) => person.condition === "Asistente").length} · Ausentes: {draft.participants.filter((person) => person.condition === "Ausente").length}</p>
        <p className={styles.note}>Convocados conserva la condición de convocatoria, aunque se registre asistencia, ausencia o excusa. Estas marcas son solo de sesión; no acreditan conexión, elegibilidad ni quórum normativo.</p>
        <label className={styles.field}>Estado del quórum<select value={draft.quorum} onChange={(e) => field("quorum", e.target.value as MinuteDraft["quorum"])}>{["Cumplido", "No cumplido", "No aplica"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className={styles.field}>Observación de quórum<textarea value={draft.quorumNote} onChange={(e) => field("quorumNote", e.target.value)} /></label>
      </section>
      <section className={styles.panel}><h3>03 · Orden del día y desarrollo</h3>{draft.linked && <details><summary>Agenda original heredada · se conserva como referencia</summary><ol>{demoInvitation.topics.map((topic) => <li key={topic}>{topic}</li>)}</ol></details>}<p className={styles.provenance}>REGISTRO DEL ACTA · agenda de trabajo y narrativa humana</p>{draft.agenda.map((topic, index) => <label className={styles.field} key={index}>Punto {String(index + 1).padStart(2, "0")}<input value={topic} onChange={(e) => field("agenda", draft.agenda.map((value, i) => i === index ? e.target.value : value))} /></label>)}<button type="button" className={styles.secondary} onClick={() => field("agenda", [...draft.agenda, ""])}>+ Añadir punto</button><label className={styles.field}>Desarrollo · asuntos tratados y contexto<textarea required rows={5} value={draft.narrative} onChange={(e) => field("narrative", e.target.value)} /></label></section>
      <section className={styles.panel}><h3>04 · Resultados estructurados</h3><p className={styles.note}>Opcionales. Los identificadores se asignan al completar cada objeto; no se exige producir todos los resultados.</p><label className={styles.field}>Hallazgo{draft.finding && ` · HAL-DEMO-${suffix}`}<textarea value={draft.finding} onChange={(e) => field("finding", e.target.value)} /></label><label className={styles.field}>Decisión{draft.decision && ` · DEC-DEMO-${suffix}`}<textarea value={draft.decision} onChange={(e) => field("decision", e.target.value)} /></label>{draft.decision && <p className={styles.note}>Origen: {draft.finding ? `HAL-DEMO-${suffix}` : `contexto EVT-DEMO-${suffix}`} · fecha {draft.date} · estado: propuesta en borrador. {draft.linked ? "Referencias sintéticas EVI-DEMO-001 a 004; no archivos almacenados." : "Sin evidencias vinculadas."}</p>}
      <div className={styles.objectBlock}><h4>Compromiso {draft.commitment && `COM-DEMO-${suffix}`}</h4><label className={styles.field}>Acción<textarea value={draft.commitment} onChange={(e) => field("commitment", e.target.value)} /></label><div className={styles.formGrid}><label className={styles.field}>Responsable institucional<select value={draft.responsibleId} onChange={(e) => field("responsibleId", e.target.value)}>{demoDirectory.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</select></label><label>Fecha objetivo<input type="date" required={Boolean(draft.commitment.trim())} min={draft.date} value={draft.due} onChange={(e) => field("due", e.target.value)} /></label></div><p className={styles.note}>Origen: {draft.decision ? `DEC-DEMO-${suffix}` : draft.finding ? `HAL-DEMO-${suffix}` : `EVT-DEMO-${suffix}`} · estado: abierto · seguimiento posterior.</p></div>
      <label className={styles.field}>Riesgo · opcional<textarea value={draft.risk} onChange={(e) => field("risk", e.target.value)} /></label><label className={styles.field}>Hito · opcional<textarea value={draft.milestone} onChange={(e) => field("milestone", e.target.value)} /></label></section>
      <section className={styles.panel}><h3>05 · Cierre y control</h3><label className={styles.field}>Observaciones<textarea value={draft.observations} onChange={(e) => field("observations", e.target.value)} /></label><label className={styles.field}>Responsable de elaboración<select value={draft.authorId} onChange={(e) => field("authorId", e.target.value)}>{demoDirectory.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</select></label></section>
    </fieldset>{!locked && <button className={styles.primary} type="submit">Vista previa del borrador DEMO →</button>}</form>
    {locked && <section id="minute-review" tabIndex={-1} className={styles.panel}><h3>Vista previa del borrador · ACT-DEMO-{suffix}</h3><p>{draft.subject} · autoría de sesión: {author?.name ?? "no seleccionada"}</p><p>Asistentes marcados en esta sesión: {draft.participants.filter((p) => p.condition === "Asistente").map((p) => p.name).join(", ") || "ninguno"}.</p><p>Ausentes marcados: {draft.participants.filter((p) => p.condition === "Ausente").map((p) => p.name).join(", ") || "ninguno"}. Sin registro no significa ausencia.</p><p>Hallazgo: {draft.finding || "No registrado"}</p><p>Decisión: {draft.decision || "No registrada"}</p><p>Compromiso: {draft.commitment || "No registrado"}</p><p className={styles.note}>La vista previa no guarda ni remite el acta para revisión.</p>{draft.stage === "Borrador" && <button className={styles.secondary} onClick={() => setReview(false)}>Volver a elaborar</button>}<MinuteLifecycle /></section>}
    <div className={styles.next}><div><h3>El cierre no completa el conocimiento</h3><p>Acta cerrada → compromisos abiertos → seguimiento → resultados → aprendizajes → conocimiento.</p><p className={styles.note}>Abre un ejemplo posterior predefinido, independiente de tus cambios. No se atribuyen resultados a este borrador.</p></div><button className={styles.secondary} onClick={onFollow}>Ver seguimiento del escenario →</button></div>
    {draft.linked && <details className={styles.details}><summary>Referencias de evidencia sintética</summary>{memoryDemo.evidence.map((item) => <p key={item.id}>{item.id} · {item.title} — no almacenado</p>)}</details>}
  </>;
}
