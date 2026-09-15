"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Search, CalendarDays, ChartNoAxesCombined } from "lucide-react";
import { agentCapabilities, type AgentCapability, type AgentContext, type AgentSuggestion } from "@/lib/conecta/agent";
import { AgentConversation } from "./AgentConversation";

const icons = { write: FileText, search: Search, plan: CalendarDays, analyze: ChartNoAxesCombined };

export function AgentCapabilityCard({ capability, onSelect }: { capability: AgentCapability; onSelect: (capability: AgentCapability) => void }) {
  const Icon = icons[capability.id];
  return <button type="button" className="agent-capability" onClick={() => onSelect(capability)}>
    <Icon size={22} aria-hidden="true" /><strong>{capability.title}</strong><span>{capability.description}</span><small>En preparación</small>
  </button>;
}

export function AgentSuggestions({ suggestions }: { suggestions: readonly AgentSuggestion[] }) {
  return <section className="agent-panel"><h2>Sugerencias para ti</h2>
    {suggestions.length ? <ul>{suggestions.map(suggestion => <li key={suggestion.id}><strong>{suggestion.title}</strong><p>{suggestion.description}</p></li>)}</ul> : <p>Todavía no hay sugerencias disponibles. Aparecerán cuando exista información de trabajo conectada y autorizada.</p>}
    <p>Proyectos: sin conexión disponible para este espacio.</p>
  </section>;
}

export function AgentWorkspace({ context, suggestions = [] }: { context: AgentContext; suggestions?: readonly AgentSuggestion[] }) {
  const [selected, setSelected] = useState<AgentCapability | null>(null);
  const name = context.user.full_name.trim().split(/\s+/)[0] || "bienvenido";
  const role = context.role;
  return <>
    <nav className="agent-breadcrumb" aria-label="Ruta de navegación"><Link href="/mapa-vivo">Mapa vivo</Link><span aria-hidden="true"> / </span><span aria-current="page">Mi agente</span></nav>
    <section className="session-strip" aria-label="Sesión activa de Plataforma Conecta"><div className="session-strip__identity"><div><p className="eyebrow">Sesión activa</p><strong>{context.user.full_name}</strong><span>{role?.title ?? "Sin cargo disponible"} · {role?.business_unit || "Unidad por confirmar"}</span></div></div></section>
    <header className="agent-panel agent-intro"><p className="eyebrow">Tu agente IA</p><h1>Hola, {name}</h1><p>Tu espacio para apoyarte en el desarrollo de tu cargo, conectando información y facilitando tu gestión.</p><span className="agent-status">Agente por configurar</span><p>La asistencia estará disponible cuando se conecten las capacidades y el conocimiento autorizado de tu cargo.</p><ul className="agent-principles"><li>Más eficiencia</li><li>Mejores decisiones</li><li>Más tiempo para trabajo de valor</li></ul></header>
    <div className="agent-columns"><div className="agent-main">
      <section className="agent-panel"><h2>¿En qué puedo ayudarte?</h2><div className="agent-capabilities">{agentCapabilities.map(capability => <AgentCapabilityCard key={capability.id} capability={capability} onSelect={setSelected} />)}</div><div role="status" aria-live="polite">{selected && <p><strong>{selected.title}:</strong> esta capacidad está en preparación. Todavía no procesa información ni genera resultados.</p>}</div></section>
      <AgentSuggestions suggestions={suggestions} />
      <section className="agent-panel"><p className="eyebrow">Contexto laboral</p><h2>Tu cargo y su alcance</h2>
        {role ? <><h3>{role.title}</h3><p>{role.purpose || "Propósito por definir."}</p><details><summary>Responsabilidades</summary>{role.responsibilities.length ? <ul>{role.responsibilities.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>Sin responsabilidades registradas.</p>}</details><details><summary>Autoridad y límites</summary>{role.authority.length ? <ul>{role.authority.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>Autoridad y límites por definir.</p>}</details><details><summary>Procesos y documentos de referencia</summary><p>Referencias de tu ficha; aún no son fuentes consultables por el agente.</p>{[...role.processes, ...role.documents].length ? <ul>{[...role.processes, ...role.documents].map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No hay referencias registradas.</p>}</details></> : <p>No hay un cargo asignado disponible. Solicita a la administración que revise tu asignación.</p>}
        <p>Conocimiento autorizado: por configurar.</p><small>Tu criterio guía las decisiones. Las acciones futuras estarán sujetas a los permisos de Conecta y a tu confirmación cuando corresponda.</small>
      </section>
    </div><aside><AgentConversation name={name} /></aside></div>
  </>;
}
