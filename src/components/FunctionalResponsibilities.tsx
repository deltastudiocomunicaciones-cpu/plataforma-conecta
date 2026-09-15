import type { FunctionalProfile } from "@/lib/conecta/functional-profile";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ExecutiveRoleProfile.module.css";

export function ProfileDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return <details className={styles.disclosure}>
    <summary>{title}<ChevronDown size={17} aria-hidden="true" /></summary>
    <div className={styles.disclosureBody}>{children}</div>
  </details>;
}

export function FunctionalResponsibilities({ profile }: { profile: FunctionalProfile }) {
  return <div className={styles.functionalModules}>
    {profile.modules.map(module => <section className={styles.functionalModule} key={module.code} aria-label={module.name}>
      <p className={styles.eyebrow}>{profile.modules.length > 1 ? `Módulo ${module.code}` : "Gestión transversal"}</p>
      <h4>{module.name}</h4>
      {module.responsibilities.map(responsibility => <ProfileDisclosure key={responsibility.code} title={`${responsibility.code}. ${responsibility.name}`}>
        <div className={styles.subactivities}>
          <p className={styles.eyebrow}>Subactividades</p>
          {responsibility.subactivities.map(subactivity => <ProfileDisclosure key={subactivity.code} title={`${subactivity.code}. ${subactivity.name}`}>
            <div className={styles.functionalDetails}>
              <ProfileDisclosure title="Tareas"><ul className={styles.list}>{subactivity.tasks.map((task, index) => <li key={index}>{task}</li>)}</ul></ProfileDisclosure>
              <ProfileDisclosure title="Control"><p>{subactivity.control}</p></ProfileDisclosure>
              <ProfileDisclosure title="Resultado"><p>{subactivity.result}</p></ProfileDisclosure>
            </div>
          </ProfileDisclosure>)}
        </div>
      </ProfileDisclosure>)}
    </section>)}
  </div>;
}
