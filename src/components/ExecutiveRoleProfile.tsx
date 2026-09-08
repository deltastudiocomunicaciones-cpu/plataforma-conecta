"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronDown, FileText, ShieldCheck, Target } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ExecutiveRoleProfile.module.css";

type Role = {
  id: string;
  title: string;
  responsibleName?: string;
  photo?: string;
  professionalProfile?: string;
  purpose: string;
  responsibilities: string[];
  activities: { name: string; subactivities: string[] }[];
  kpis: string[];
  authority: string[];
  processes: string[];
  documents: string[];
  profile: string[];
  risks: string[];
};

export type NivelarProfilePreview = {
  productive: string;
  connection: string;
  unproductive: string;
  unclassified: string;
  workWindow: string;
  interpretation: string;
  conectaReading: string;
  recommendedAction: string;
  statusLabel: string;
};

type Props = {
  role: Role;
  parentTitle: string;
  initials: string;
  protectedDocument: string;
  protectedPhone: string;
  canViewSensitiveData: boolean;
  showSensitiveData: boolean;
  onToggleSensitiveData: () => void;
  onOpenReports: () => void;
  onSelectRole: (id: string) => void;
  directReports: { id: string; title: string }[];
  nivelar: NivelarProfilePreview | null;
};

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={styles.disclosure}>
      <summary>{title}<ChevronDown size={17} aria-hidden="true" /></summary>
      <div className={styles.disclosureBody}>{children}</div>
    </details>
  );
}

function TextList({ items }: { items: string[] }) {
  return items.length ? <ul className={styles.list}>{items.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul> : <p className={styles.muted}>Por definir para este cargo.</p>;
}

export function ExecutiveRoleProfile({ role, parentTitle, initials, protectedDocument, protectedPhone, canViewSensitiveData, showSensitiveData, onToggleSensitiveData, onOpenReports, onSelectRole, directReports, nivelar }: Props) {
  return (
    <section className={styles.profile} aria-label="Ficha ejecutiva del cargo">
      <header className={styles.hero}>
        <div className={styles.purpose}>
          <span className={styles.eyebrow}><Target size={15} aria-hidden="true" /> Propósito del cargo</span>
          <h3>El aporte de este cargo</h3>
          <p>{role.purpose}</p>
        </div>
        <div className={styles.identity}>
          <div className={styles.identityInfo}>
            <div className={styles.avatar}>
              {role.photo ? <Image src={role.photo} width={208} height={277} alt={`Fotografía de ${role.responsibleName || "la persona responsable"}`} /> : <span aria-hidden="true">{initials}</span>}
            </div>
            <div><span className={styles.eyebrow}>Responsable</span><strong>{role.responsibleName || "Por confirmar"}</strong></div>
          </div>
          <div className={styles.reportsTo}><span>Reporta a</span><p>{parentTitle}</p></div>
        </div>
      </header>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section className={styles.responsibilities} aria-label="Responsabilidades principales">
            <div className={styles.sectionHeading}><span className={styles.eyebrow}>Alcance y compromiso</span><h3>Responsabilidades principales</h3></div>
            <ol className={styles.numbered}>
              {role.responsibilities.slice(0, 3).map((item, i) => <li key={`${i}-${item}`}><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><p>{item}</p></li>)}
            </ol>
            {!role.responsibilities.length && <p className={styles.muted}>Responsabilidades por definir.</p>}
            {role.responsibilities.length > 3 && <Disclosure title={`Ver ${role.responsibilities.length - 3} responsabilidades adicionales`}><TextList items={role.responsibilities.slice(3)} /></Disclosure>}
          </section>

          <div className={styles.detailsGroup}>
            <Disclosure title="Actividades">
              {role.activities.length ? role.activities.map((activity, i) => (
                <section className={styles.activity} key={`${i}-${activity.name}`} aria-label={`Actividad ${i + 1}: ${activity.name}`}>
                  <span className={styles.eyebrow}>Actividad {String(i + 1).padStart(2, "0")}</span>
                  <h4>{activity.name}</h4>
                  <div className={styles.subactivities}>
                    <Disclosure title={`Subactividades · ${activity.subactivities.length}`}>
                      {activity.subactivities.length ? <TextList items={activity.subactivities} /> : <p className={styles.muted}>Subactividades por definir para esta actividad.</p>}
                    </Disclosure>
                  </div>
                </section>
              )) : <p className={styles.muted}>Actividades por definir.</p>}
            </Disclosure>
            <Disclosure title="Autoridad y límites"><TextList items={role.authority} /></Disclosure>
            <Disclosure title="Procesos y documentos"><h4>Procesos relacionados</h4><TextList items={role.processes} /><h4>Documentos de referencia</h4><TextList items={role.documents} /></Disclosure>
            <Disclosure title="Perfil requerido y riesgos"><h4>Perfil requerido</h4><TextList items={role.profile} /><h4>Riesgos del cargo</h4><TextList items={role.risks} /></Disclosure>
            <Disclosure title={`Reportes directos · ${directReports.length}`}>
              {directReports.length ? <div className={styles.reportLinks}>{directReports.map(node => <button type="button" key={node.id} onClick={() => onSelectRole(node.id)}>{node.title}<ArrowUpRight aria-hidden="true" size={16} /></button>)}</div> : <p className={styles.muted}>Este cargo no tiene reportes directos registrados.</p>}
            </Disclosure>
            <Disclosure title="Información del responsable">
              <p>{role.professionalProfile || role.profile.join(". ") || "Perfil profesional por confirmar."}</p>
              <dl className={styles.contact}><div><dt>Documento</dt><dd>{protectedDocument}</dd></div><div><dt>Teléfono</dt><dd>{protectedPhone}</dd></div></dl>
              <button className={styles.secondaryButton} type="button" disabled={!canViewSensitiveData} aria-pressed={showSensitiveData && canViewSensitiveData} onClick={onToggleSensitiveData}><ShieldCheck size={16} aria-hidden="true" />{showSensitiveData && canViewSensitiveData ? "Ocultar datos personales" : "Mostrar datos personales"}</button>
              <p className={styles.note}>{canViewSensitiveData ? "Los datos personales permanecen protegidos hasta que decidas mostrarlos." : "Tu acceso permite consultar el perfil, sin mostrar datos personales."}</p>
            </Disclosure>
          </div>
        </div>

        <aside className={styles.rail} aria-label="Nivelar e indicadores del cargo">
          <section className={styles.nivelar}>
            <div className={styles.nivelarHeader}><span className={styles.eyebrow}>Nivelar × Conecta</span><h3>Lectura del perfil</h3><span className={styles.badge}>{nivelar ? "Datos piloto · Sin conexión en vivo" : "Sin evaluación conectada"}</span></div>
            <div className={styles.nivelarBody}>
              {nivelar ? <>
                <div className={styles.result}><span>Tiempo productivo · Piloto</span><strong>{nivelar.productive}</strong><small>{nivelar.workWindow}</small></div>
                <dl className={styles.metrics}><div><dt>Conexión</dt><dd>{nivelar.connection}</dd></div><div><dt>Improductivo</dt><dd>{nivelar.unproductive}</dd></div><div><dt>Sin clasificar</dt><dd>{nivelar.unclassified}</dd></div><div><dt>Estado del piloto</dt><dd>{nivelar.statusLabel}</dd></div></dl>
                <div className={styles.reading}><h4>Interpretación Nivelar</h4><p>{nivelar.interpretation}</p></div>
                <div className={styles.reading}><h4>Cruce Conecta</h4><p>{nivelar.conectaReading}</p></div>
                <div className={styles.nextAction}><h4>Acción sugerida · Piloto</h4><p>{nivelar.recommendedAction}</p></div>
                <p className={styles.note}>Lectura ilustrativa. No representa una evaluación validada ni datos conectados en tiempo real.</p>
              </> : <>
                <div className={styles.empty}><span className={styles.emptyMark} aria-hidden="true">—</span><h4>Resultado pendiente</h4><p>La lectura estará disponible cuando exista una evaluación vinculada a este cargo.</p></div>
                <div className={styles.nextAction}><h4>Preparar el perfil</h4><p>Revisar las responsabilidades y las evidencias de gestión antes de contrastarlas con Nivelar.</p></div>
              </>}
              <button className={styles.primaryButton} type="button" onClick={onOpenReports}><FileText size={16} aria-hidden="true" />Consultar informes<ArrowUpRight size={16} aria-hidden="true" /></button>
            </div>
          </section>
          <section className={styles.indicators} aria-label="Indicadores definidos para el cargo"><span className={styles.eyebrow}>Criterios de seguimiento</span><h3>Indicadores del cargo</h3><p className={styles.note}>Indicadores definidos en la ficha; no son resultados medidos.</p><TextList items={role.kpis} /></section>
        </aside>
      </div>
    </section>
  );
}
