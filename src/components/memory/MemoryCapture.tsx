import { useMemo, useState } from "react";
import { demoDirectory, demoInvitation, eventKinds } from "@/lib/conecta/memory-demo-data";
import { organizationalUnitCategories, type OrganizationalUnit } from "@/lib/conecta/organizational-catalog";
import type { DemoDirectoryPerson, DemoParticipant, MinuteDraft } from "@/lib/conecta/memory-demo-types";
import styles from "./MemoryDemo.module.css";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function MemoryCapture({ draft, organizationalUnits, onChange, onContinue, onSave, saveFeedback, savedCode }: { draft: MinuteDraft; organizationalUnits: OrganizationalUnit[]; onChange: (draft: MinuteDraft) => void; onContinue: () => void; onSave: () => void; saveFeedback: "idle" | "saved" | "dirty" | "error"; savedCode?: string }) {
  const [peopleQuery, setPeopleQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("convocante");
  const selectedIds = new Set(draft.participants.map((person) => person.id));
  const unit = organizationalUnits.find((item) => item.id === draft.unitId);
  const filteredDirectory = useMemo(() => {
    const unitById = new Map(organizationalUnits.map((item) => [item.id, item]));
    const selectedUnit = unitFilter === "convocante" ? draft.unitId : unitFilter;
    const query = normalize(peopleQuery.trim());
    return demoDirectory
      .filter((person) => person.active)
      .filter((person) => !selectedUnit || person.unitId === selectedUnit)
      .filter((person) => normalize(`${person.name} ${person.role} ${unitById.get(person.unitId)?.name ?? ""}`).includes(query))
      .map((person) => ({ ...person, unit: unitById.get(person.unitId)?.name ?? "Unidad DEMO sin correspondencia" }))
      .sort((a, b) => Number(b.unitId === draft.unitId) - Number(a.unitId === draft.unitId));
  }, [draft.unitId, peopleQuery, unitFilter, organizationalUnits]);

  function togglePerson(person: DemoDirectoryPerson & { unit: string }, selected: boolean) {
    if (selected) {
      const participant: DemoParticipant = {
        ...person,
        condition: "Convocado",
        invited: true,
        inherited: false,
        rsvp: "",
      };
      onChange({ ...draft, participants: draft.participants.some((item) => item.id === person.id) ? draft.participants : [...draft.participants, participant] });
    } else {
      onChange({ ...draft, participants: draft.participants.filter((item) => item.id !== person.id) });
    }
  }

  function linkInvitation() {
    onChange({
      ...draft,
      linked: true,
      subject: demoInvitation.name,
      date: demoInvitation.event_date,
      start: demoInvitation.start_time,
      modality: demoInvitation.modality,
      place: demoInvitation.address,
      agenda: [...demoInvitation.topics],
    });
  }

  if (draft.stage !== "Borrador") return <section className={styles.panel}><h2>Borrador de sesión</h2><p>El registro se conserva únicamente en el estado de esta página. No hay persistencia ni aprobación institucional.</p><button className={styles.primary} onClick={onContinue}>Continuar elaboración</button></section>;

  return <>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>PRODUCCIÓN DOCUMENTAL / CAPTURA</p><h2>Crear borrador de acta</h2><p>El borrador y sus cambios viven solo en esta sesión DEMO.</p></div><span className={styles.badge}>No oficial · sin guardar en servidor</span></div>
    <fieldset className={styles.panel}><legend>Origen del registro</legend><div className={styles.kindGrid}>{eventKinds.map((kind) => <label key={kind}><input type="radio" name="event-kind" checked={draft.kind === kind} onChange={() => onChange({ ...draft, kind, otherKind: "" })} /> {kind}</label>)}</div>
      {draft.kind === "Reunión" && <section className={styles.panel}><h3>Convocatoria relacionada</h3><p>{demoInvitation.name} · {demoInvitation.event_date} · {demoInvitation.start_time}</p><p className={styles.mono}>{demoInvitation.reference} → {demoInvitation.id} · fixture DEMO</p><p className={styles.note}>Vista contractual de una convocatoria sintética. No consulta Convocatorias ni crea una segunda reunión. Los nombres RSVP no se convierten en personas o asistentes.</p><div className={styles.toolbar}><button type="button" className={styles.secondary} disabled={draft.linked} onClick={linkInvitation}>{draft.linked ? "Convocatoria DEMO vinculada" : "Vincular convocatoria DEMO"}</button><a className={styles.secondary} href="/convocatorias">Abrir Convocatorias</a></div></section>}
      <div className={styles.formGrid}><label>Unidad productora de referencia<select value={draft.unitId} onChange={(event) => onChange({ ...draft, unitId: event.target.value })}>{organizationalUnitCategories.map((category) => <optgroup key={category} label={category}>{organizationalUnits.filter((item) => item.category === category).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</optgroup>)}</select><small className={styles.note}>Catálogo descriptivo proyectado del Mapa Vivo · no verifica adscripción laboral.</small></label><label>Proceso / asunto de proceso<input required value={draft.process} onChange={(event) => onChange({ ...draft, process: event.target.value })} /></label><label>Nombre / asunto<input required value={draft.subject} readOnly={draft.linked} onChange={(event) => onChange({ ...draft, subject: event.target.value })} /></label><label>Fecha prevista<input required type="date" value={draft.date} readOnly={draft.linked} onChange={(event) => onChange({ ...draft, date: event.target.value })} /></label><label>Hora prevista<input required type="time" value={draft.start} readOnly={draft.linked} onChange={(event) => onChange({ ...draft, start: event.target.value })} /></label></div>
      {draft.participants.length > 0 && <p className={styles.note}>Cambiar la unidad convocante no reasigna las personas DEMO ya seleccionadas; conservan la unidad descriptiva que tenían al seleccionarse.</p>}
      {draft.kind === "Otro" && <label className={styles.field}>Especifique el tipo de acontecimiento<input required value={draft.otherKind} onChange={(event) => onChange({ ...draft, otherKind: event.target.value })} /></label>}
      <p className={styles.note}>Empresa: {draft.organization}. El código oficial y el UUID no se asignan en la demo. La convocatoria mantiene su identidad de evento; el acta formal requiere un servicio autorizado.</p>
    </fieldset>

    <section className={styles.panel} aria-labelledby="demo-directory-title">
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>PARTICIPANTES / SELECCIÓN</p><h3 id="demo-directory-title">Directorio demostrativo</h3><p>Personas completamente ficticias; no son funcionarios ni usuarios de CONECTA.</p></div><span className={styles.badge}>{draft.participants.length} seleccionados</span></div>
      <div className={styles.formGrid}><label>Buscar por nombre, cargo o unidad<input type="search" value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Ej. Persona DEMO 03" /></label><label>Filtrar por unidad<select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}><option value="convocante">Primero: unidad convocante · {unit?.name ?? "sin seleccionar"}</option><option value="">Todas las unidades del mapa</option>{organizationalUnitCategories.map((category) => <optgroup key={category} label={category}>{organizationalUnits.filter((item) => item.category === category).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</optgroup>)}</select></label></div>
      <p className={styles.note}>El listado se ordena primero por la unidad convocante. La búsqueda en otras gerencias solo usa los fixtures de esta pantalla; no consulta perfiles, correos ni datos sensibles.</p>
      <div className={styles.directoryList}>{filteredDirectory.map((person) => <label className={styles.directoryPerson} key={person.id}><input type="checkbox" checked={selectedIds.has(person.id)} onChange={(event) => togglePerson(person, event.target.checked)} /><span><strong>{person.name}</strong><small>{person.role}</small><small>{person.unit} · activa en el escenario DEMO</small></span><code>{person.id}</code></label>)}{filteredDirectory.length === 0 && <p className={styles.empty}>No hay personas DEMO que coincidan con esos filtros.</p>}</div>
      <p className={styles.note}>La selección crea una instantánea de demostración de persona, cargo y unidad. No acredita relación laboral, invitación enviada, RSVP ni asistencia.</p>
    </section>

    <form className={styles.panel} onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
      <p className={styles.provenance}>{draft.linked ? "CONVOCATORIA DEMO VINCULADA · datos previstos" : "REGISTRO NUEVO · escenario DEMO"}</p>
      {draft.kind === "Otro" && <p className={styles.note}>El tipo se registra como texto de esta sesión; no se crea una tipología institucional.</p>}
      <p className={styles.contextBand}>Origen visual: {draft.linked ? `${demoInvitation.reference} → ${demoInvitation.id}` : "acontecimiento sin convocatoria vinculada"} · participantes seleccionados: {draft.participants.length}. La lista convocada no se convierte en asistencia.</p>
      <div className={styles.toolbar}><button className={styles.primary} type="submit">Elaborar borrador de acta →</button><button className={styles.secondary} type="button" onClick={onSave}>Guardar en este navegador</button>{saveFeedback === "saved" && <span role="status" className={styles.note}>✓ Borrador guardado correctamente en este navegador{savedCode ? ` · ${savedCode}` : ""}. Recuperable desde Archivo institucional · DEMO local.</span>}{saveFeedback === "dirty" && <span role="status" className={styles.note}>Cambios pendientes de guardar.</span>}{saveFeedback === "error" && <span role="alert" className={styles.note}>No se pudo guardar. El borrador continúa abierto.</span>}</div>
    </form>
  </>;
}
