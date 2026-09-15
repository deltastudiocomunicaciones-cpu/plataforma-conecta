import { ProfileDisclosure } from "./FunctionalResponsibilities";
import { getCompanyPortfolio, getReferenceDays } from "@/lib/conecta/company-portfolio";
import styles from "./ExecutiveRoleProfile.module.css";

const numberFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

export function AssignedCompanies({ positionId }: { positionId: string }) {
  const portfolio = getCompanyPortfolio(positionId);
  return <section className={styles.assignedCompanies} aria-label="Empresas a cargo">
    <ProfileDisclosure title={`EMPRESAS A CARGO${portfolio ? ` · ${portfolio.companies.length}` : ""}`}>
      {portfolio ? <>
        <p><strong>{portfolio.companies.length} empresas/clientes · {numberFormat.format(getReferenceDays(portfolio))} días asignados</strong></p>
        <p className={styles.note}>Días asignados a cada empresa según la relación suministrada. Estos valores no son tiempos medidos por Nivelar.</p>
        {portfolio.companies.map(company => <ProfileDisclosure key={company.id} title={company.name}>
          <dl className={styles.companyIndicators}>
            <div><dt>Días asignados</dt><dd>{numberFormat.format(company.referenceDays)}</dd></div>
            <div><dt>Tiempo real · Nivelar</dt><dd>Pendiente de vinculación</dd></div>
          </dl>
          <p className={styles.note}>Entregables, calidad y seguimiento de esta empresa pendientes de conexión.</p>
        </ProfileDisclosure>)}
      </> : <p className={styles.note}>Relación de empresas pendiente de información. Aún no se ha registrado una lista para este cargo.</p>}
      <dl className={styles.companyIndicators}>
        <div><dt>Eficiencia del trabajo</dt><dd>Sin medición disponible</dd></div>
        <div><dt>Capacidad disponible</dt><dd>Pendiente de evaluación</dd></div>
      </dl>
      <div className={styles.nextAction}>
        <h4>Oportunidades de crecimiento</h4>
        <p>Identificar tiempo disponible manteniendo la calidad y el cumplimiento, para evaluar nuevas empresas o actividades de auditoría y oportunidades de mayores ingresos.</p>
      </div>
      <p className={styles.note}>La evaluación combinará tiempo dedicado, trabajo terminado, complejidad y calidad. Las nuevas asignaciones y condiciones de ingreso se acordarán con la gerencia.</p>
    </ProfileDisclosure>
  </section>;
}
