"use client";

import { useMemo, useState } from "react";
import { demoOrganizationalUnits, memoryDemo, memoryNodes } from "@/lib/conecta/memory-demo-data";
import type { MinuteDraft } from "@/lib/conecta/memory-demo-types";
import { formatMemoryDate } from "@/lib/conecta/memory-demo-data";
import styles from "./MemoryDemo.module.css";

type ArchiveRecord = {
  id: string;
  title: string;
  subject: string;
  type: string;
  date: string;
  unit: string;
  unitId: string;
  state: string;
  version: string;
  author: string;
  classification: string;
  related: string[];
  description: string;
  provenance: string;
  temporary?: boolean;
};

const sampleRecords: ArchiveRecord[] = [
  {
    id: "ACT-DEMO-001",
    title: memoryDemo.title,
    subject: "Articulación del modelo financiero",
    type: "Acta DEMO",
    date: "2026-10-04",
    unit: "Gerencia Administrativa y Financiera",
    unitId: "gerencia-08",
    state: "Ejemplo de acta · DEMO",
    version: "Muestra fija · no versionada",
    author: "Persona DEMO 01",
    classification: "Clasificación institucional pendiente",
    related: ["EVT-DEMO-001 · reunión de escenario", "DEC-DEMO-001 · propuesta vinculada"],
    description: memoryDemo.context,
    provenance: "Fixture demostrativo del repositorio. No es un documento institucional archivado.",
  },
  {
    id: "DEC-DEMO-001",
    title: memoryNodes[3].title,
    subject: "Modelo financiero transversal al ciclo del proyecto",
    type: "Decisión DEMO",
    date: "2026-10-04",
    unit: "Gerencia Administrativa y Financiera",
    unitId: "gerencia-08",
    state: "Propuesta · sin aprobación",
    version: "Referencia de escenario",
    author: "Persona DEMO 02",
    classification: "Clasificación institucional pendiente",
    related: ["ACT-DEMO-001 · acta de escenario", "COM-DEMO-001 · seguimiento sintético"],
    description: memoryNodes[3].body,
    provenance: "Decisión de ejemplo. No representa una decisión aprobada por Grupo A&C.",
  },
  {
    id: "COM-DEMO-001",
    title: memoryNodes[4].title,
    subject: "Estructurar la captura de información",
    type: "Compromiso DEMO",
    date: "2026-10-07",
    unit: "Gerencia de Proyectos",
    unitId: "gerencia-13",
    state: "Seguimiento sintético",
    version: "Referencia de escenario",
    author: "Persona DEMO 03",
    classification: "Clasificación institucional pendiente",
    related: ["DEC-DEMO-001 · propuesta de origen", "EVT-DEMO-001 · evento de escenario"],
    description: memoryNodes[4].body,
    provenance: "Seguimiento de presentación, no un compromiso asignado a una persona real.",
  },
  {
    id: "EVI-DEMO-001",
    title: "Cuatro referencias para comprender el contexto",
    subject: "Arquitectura y método · referencias sintéticas",
    type: "Referencia DEMO",
    date: "2026-10-04",
    unit: "Gerencia de Innovación y Tecnología",
    unitId: "gerencia-06",
    state: "Sin archivo adjunto",
    version: "No aplica · referencia textual",
    author: "Escenario de presentación",
    classification: "No clasificada",
    related: ["ACT-DEMO-001 · contexto de escenario"],
    description: "Las referencias de ejemplo aportan contexto al caso. En esta experiencia no hay archivos cargados ni evidencia verificable.",
    provenance: "Metadata de presentación. No se almacenan binarios ni enlaces de descarga.",
  },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function MemoryArchive({ draft }: { draft: MinuteDraft }) {
  const [query, setQuery] = useState("");
  const [unitId, setUnitId] = useState("");
  const [type, setType] = useState("");
  const [state, setState] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState("ACT-DEMO-001");

  const records = useMemo<ArchiveRecord[]>(() => {
    const sessionDraft = draft.subject.trim() ? [{
      id: "TEMP-DEMO-001",
      title: draft.subject,
      subject: draft.process,
      type: "Acta · borrador en sesión",
      date: draft.date,
      unit: demoOrganizationalUnits.find((unit) => unit.id === draft.unitId)?.name ?? "Unidad sin verificar",
      unitId: draft.unitId,
      state: "Borrador local · no persistido",
      version: "No hay versión formal",
      author: "Autor de sesión DEMO",
      classification: "Pendiente de definición institucional",
      related: [draft.linked ? `${memoryDemo.meetingEventId} · vínculo visual DEMO` : "Sin convocatoria relacionada"],
      description: draft.objective || "El borrador aún no tiene un propósito diligenciado.",
      provenance: "Estado React de esta página. Se pierde al recargar; no se guardó en servidor.",
      temporary: true,
    }] satisfies ArchiveRecord[] : [];
    return [...sessionDraft, ...sampleRecords];
  }, [draft]);

  const filtered = records.filter((record) => {
    const text = normalize(`${record.id} ${record.title} ${record.subject} ${record.unit} ${record.description}`);
    return (!query || text.includes(normalize(query.trim())))
      && (!unitId || record.unitId === unitId)
      && (!type || record.type.startsWith(type))
      && (!state || record.state.includes(state))
      && (!from || record.date >= from)
      && (!to || record.date <= to);
  });
  const selected = filtered.find((record) => record.id === selectedId) ?? filtered[0];

  return <>
    <div className={styles.sectionHead}><div><p className={styles.eyebrow}>ARCHIVO INSTITUCIONAL / EXPLORADOR</p><h2>Consultar registros y relaciones</h2><p>Los fixtures y el borrador de sesión están rotulados como DEMO. No son archivo institucional real.</p></div><span className={styles.badge}>Sin acceso a repositorio real</span></div>
    <section className={styles.panel} aria-label="Filtros del archivo demostrativo">
      <div className={styles.archiveFilters}>
        <label>Buscar por código, título o asunto<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ACT-DEMO-001, asunto…" /></label>
        <label>Gerencia<select value={unitId} onChange={(event) => setUnitId(event.target.value)}><option value="">Todas las unidades DEMO</option>{demoOrganizationalUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos los tipos</option><option>Acta</option><option>Decisión</option><option>Compromiso</option><option>Referencia</option></select></label>
        <label>Estado<select value={state} onChange={(event) => setState(event.target.value)}><option value="">Todos los estados</option><option>Ejemplo</option><option>Propuesta</option><option>Seguimiento</option><option>Sin archivo</option><option>Borrador local</option></select></label>
        <label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      </div>
      <p className={styles.note} role="status">{filtered.length} elementos de demostración · sin búsqueda remota · RLS y permisos institucionales no se consultan desde esta pantalla.</p>
    </section>

    <div className={styles.archiveLayout}>
      <section aria-label="Resultados del archivo"><h3>Resultados de muestra</h3>
        {filtered.length ? <ul className={styles.archiveList}>{filtered.map((record) => <li key={record.id}><button className={styles.archiveItem} type="button" aria-pressed={selected?.id === record.id} onClick={() => setSelectedId(record.id)}><span className={styles.row}><code>{record.id}</code><span className={styles.badge}>{record.type}</span></span><strong>{record.title}</strong><span>{record.unit} · {formatMemoryDate(record.date)} · {record.state}</span></button></li>)}</ul> : <div className={styles.empty}><h3>No hay resultados</h3><p>Amplía los filtros para volver a mostrar los ejemplos.</p></div>}
      </section>
      {selected && <article className={styles.panel} aria-live="polite">
        <p className={styles.eyebrow}>FICHA DOCUMENTAL · {selected.temporary ? "BORRADOR EN ESTA SESIÓN" : "FIXTURE DEMO"}</p>
        <h3>{selected.title}</h3>
        <p className={styles.lead}>{selected.description}</p>
        <dl className={styles.metadata}>
          <div><dt>Identificador visible</dt><dd><code>{selected.id}</code> · no oficial</dd></div>
          <div><dt>UUID institucional</dt><dd>No generado en esta experiencia DEMO</dd></div>
          <div><dt>Estado</dt><dd>{selected.state}</dd></div>
          <div><dt>Versión</dt><dd>{selected.version}</dd></div>
          <div><dt>Unidad productora</dt><dd>{selected.unit} · referencia de prototipo</dd></div>
          <div><dt>Autoría</dt><dd>{selected.author} · fixture</dd></div>
          <div><dt>Fecha</dt><dd>{formatMemoryDate(selected.date)} · fecha de ejemplo</dd></div>
          <div><dt>Clasificación</dt><dd>{selected.classification}</dd></div>
        </dl>
        <h4>Relaciones visibles</h4>
        <ul>{selected.related.map((relation) => <li key={relation}>{relation}</li>)}</ul>
        <p className={styles.note}>{selected.provenance}</p>
        <p className={styles.note}>Historial de revisión, aprobación, cierre y auditoría: no implementado. No se ofrece una acción de aprobación.</p>
        <a className={styles.secondary} href="/templates/conecta-acta-v1-en-blanco.pdf" download>Descargar formato institucional en blanco</a>
      </article>}
    </div>
  </>;
}
