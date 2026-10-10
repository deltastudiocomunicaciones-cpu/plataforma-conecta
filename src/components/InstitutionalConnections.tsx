import Link from "next/link";

// Navigation between existing surfaces; no resource links, fetches or grants.
export function InstitutionalConnections() {
  return <section className="institutional-connections" aria-label="Relaciones entre módulos CONECTA">
    <h2>Recorrido institucional</h2>
    <p>Cargo y procesos → convocatoria → memoria → compromisos → informes y seguimiento.</p>
    <p>Este recorrido conecta vistas. Los vínculos persistidos entre actas, compromisos e informes permanecen pendientes; navegar no crea registros.</p>
    <nav aria-label="Accesos a módulos existentes">
      <Link href="/mapa-vivo#organigrama">Mapa Vivo y cargos</Link>
      <Link href="/mapa-vivo#detalle">Perfil institucional y funciones</Link>
      <Link href="/convocatorias">Convocatorias</Link>
      <Link href="/memoria-viva">Memoria Viva · demostración</Link>
      <Link href="/mapa-vivo#gestion-informes">Informes y seguimiento local</Link>
      <Link href="/mapa-vivo/mi-agente">Mi Agente · lectura del cargo asignado</Link>
    </nav>
    <details><summary>Fuentes y relaciones pendientes</summary>
      <ul>
        <li>Convocatorias utiliza meeting_events y su API existente. RSVP no acredita asistencia, acta ni cierre de compromisos.</li>
        <li>Memoria Viva conserva el contrato aprobado. Sus ejemplos y compromisos son demostrativos y no se almacenan; no hay escritura habilitada en sus tablas.</li>
        <li>Informes, evidencias referenciadas y dashboard del mapa usan seguimiento local. No constituyen vínculos persistidos con actas.</li>
        <li>Nivelar conserva sus endpoints. Las señales live requieren atribución validada; los datos piloto no acreditan vinculación ni desempeño.</li>
        <li>Mi Agente muestra fuentes institucionales del cargo asignado cuando existe correspondencia explícita. No hay servicio de IA ni acciones institucionales habilitadas.</li>
      </ul>
    </details>
  </section>;
}
