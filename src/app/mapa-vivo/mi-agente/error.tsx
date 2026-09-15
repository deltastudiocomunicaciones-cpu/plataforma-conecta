"use client";

import Link from "next/link";

export default function AgentError({ reset }: { reset: () => void }) {
  return <section className="ai-agent-space" role="alert"><p className="eyebrow">Plataforma Conecta</p><h1>No pudimos abrir tu agente</h1><p>No fue posible verificar la sesión o cargar el cargo. Intenta nuevamente.</p><button className="export-button" type="button" onClick={reset}>Reintentar</button> <Link href="/mapa-vivo">Volver al mapa vivo</Link></section>;
}
