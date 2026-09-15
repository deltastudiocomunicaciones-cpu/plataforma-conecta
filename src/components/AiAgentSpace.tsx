import Link from "next/link";

export function AiAgentSpace() {
  return (
    <section className="ai-agent-space" aria-label="Herramienta de inteligencia artificial del cargo">
      <p className="eyebrow">Herramientas del cargo</p>
      <h3>Mi agente IA</h3>
      <p>Tu espacio inteligente para desarrollar tu cargo.</p>
      <p>Conoce tus responsabilidades, procesos y proyectos y te acompaña dentro de los límites de tu rol, cuando esté configurado.</p>
      <dl>
        <div><dt>Conocimiento</dt><dd>Por configurar</dd></div>
        <div><dt>Capacidades</dt><dd>En preparación</dd></div>
        <div><dt>Alcance</dt><dd>Tu cargo asignado</dd></div>
      </dl>
      <small>Pendiente de configuración. No hay un agente conectado.</small>
      <p><Link className="export-button" href="/mapa-vivo/mi-agente">Abrir mi agente</Link></p>
    </section>
  );
}
