import type { MinuteDraft } from "@/lib/conecta/memory-demo-types";
import type { InstitutionalMeeting } from "@/lib/conecta/institutional-minutes";
import styles from "./MemoryDemo.module.css";

type Feedback = { kind: "success" | "error" | "conflict"; message: string; code?: string; version?: number } | null;

export function InstitutionalMinuteEditor({
  draft, onChange, meetingEventId, onMeetingEventChange,
  meetings, meetingsBusy, meetingsError, onRefreshMeetings,
  onSave, busy, feedback, existingCode,
}: {
  draft: MinuteDraft;
  onChange: (draft: MinuteDraft) => void;
  meetingEventId: string | null;
  onMeetingEventChange: (id: string | null) => void;
  meetings: InstitutionalMeeting[];
  meetingsBusy: boolean;
  meetingsError: string;
  onRefreshMeetings: () => void;
  onSave: () => void;
  busy: boolean;
  feedback: Feedback;
  existingCode?: string;
}) {
  function update<K extends keyof MinuteDraft>(key: K, value: MinuteDraft[K]) {
    onChange({ ...draft, [key]: value });
  }
  function selectMeeting(id: string) {
    onMeetingEventChange(id || null);
    const meeting = meetings.find((item) => item.id === id);
    if (meeting) {
      // The meeting is the source of scheduled information, not proof of attendance.
      onChange({
        ...draft,
        subject: draft.subject || meeting.name,
        date: draft.date || meeting.eventDate,
        kind: "Reunión",
      });
    }
  }
  const selected = meetings.find((item) => item.id === meetingEventId);
  return <section className={styles.panel} aria-labelledby="institutional-editor-title">
    <p className={styles.eyebrow}>SUPABASE · ACTA INSTITUCIONAL REAL · RLS</p>
    <h2 id="institutional-editor-title">{existingCode ? "Continuar acta institucional" : "Nueva acta institucional"}</h2>
    <p className={styles.note}>Este formulario guarda en Supabase y genera un registro versionado. No utiliza personas, convocatorias ni datos precargados de la demostración. Hasta su aprobación formal, el acta permanece en estado borrador.</p>
    {existingCode && <p className={styles.contextBand}>Documento en edición: {existingCode}</p>}
    <div className={styles.formGrid}>
      <label>Convocatoria de origen · módulo Convocatorias
        <select value={meetingEventId ?? ""} onChange={(event) => selectMeeting(event.target.value)} disabled={meetingsBusy || !!meetingsError || busy}>
          <option value="">Sin convocatoria asociada</option>
          {meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.eventDate} · {meeting.name} · {meeting.id.slice(0, 8)}</option>)}
          {meetingEventId && !selected && <option value={meetingEventId}>Vínculo actual · {meetingEventId}</option>}
        </select>
      </label>
      <label>Nombre / asunto del acta
        <input value={draft.subject} onChange={(event) => update("subject", event.target.value)} maxLength={300} required placeholder="Asunto real de la sesión" />
      </label>
      <label>Fecha de la sesión
        <input type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} />
      </label>
      <label>Proceso / unidad que documenta
        <input value={draft.process} onChange={(event) => update("process", event.target.value)} placeholder="Ej. Gerencia PYMES" />
      </label>
    </div>
    {selected && <p className={styles.contextBand}>Origen verificado en la lista autorizada: {selected.name} · {selected.eventDate} · UUID {selected.id}. La convocatoria no se modifica al guardar el acta.</p>}
    {meetingEventId && !selected && <p role="alert" className={styles.note}>El vínculo existente no aparece entre las convocatorias cargadas. Se conserva su UUID; actualiza la lista antes de cambiarlo.</p>}
    {meetingsBusy && <p role="status" className={styles.note}>Consultando Convocatorias con la sesión institucional…</p>}
    {meetingsError && <p role="alert" className={styles.note}>{meetingsError}. No guardes vínculos hasta recuperar las convocatorias.</p>}
    <button type="button" className={styles.secondary} disabled={meetingsBusy || busy} onClick={onRefreshMeetings}>Actualizar lista de Convocatorias</button>
    <p className={styles.note}>La asociación solo identifica el evento de origen; no acredita quórum, respuesta a invitación ni asistencia.</p>
    <label className={styles.field}>Objetivo o contexto
      <textarea rows={3} value={draft.objective} onChange={(event) => update("objective", event.target.value)} />
    </label>
    <label className={styles.field}>Desarrollo de la sesión
      <textarea rows={6} value={draft.narrative} onChange={(event) => update("narrative", event.target.value)} placeholder="Relato elaborado y validado por la persona responsable" />
    </label>
    <label className={styles.field}>Decisión registrada · borrador
      <textarea rows={3} value={draft.decision} onChange={(event) => update("decision", event.target.value)} />
    </label>
    <label className={styles.field}>Compromiso · borrador
      <textarea rows={3} value={draft.commitment} onChange={(event) => update("commitment", event.target.value)} />
    </label>
    <p className={styles.note}>La identidad del autor, la empresa, el código y la versión los asigna el servidor. Ninguna decisión ni compromiso queda oficialmente aprobado al guardar este borrador.</p>
    <div className={styles.toolbar}>
      <button type="button" className={styles.primary} disabled={busy || !!meetingsError || !draft.subject.trim() || (!!meetingEventId && !selected)} onClick={onSave}>{busy ? "Guardando…" : existingCode ? "Guardar nueva versión institucional" : "Crear acta institucional en Supabase"}</button>
      {feedback && <p role={feedback.kind === "success" ? "status" : "alert"} className={styles.note}>{feedback.message}{feedback.code ? ` · ${feedback.code} · v${feedback.version}` : ""}</p>}
    </div>
  </section>;
}
