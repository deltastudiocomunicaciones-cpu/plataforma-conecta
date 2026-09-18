"use client";

import { Sparkles, ArrowUp, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AgentConversationService, AgentMessage } from "@/lib/conecta/agent";

export function AgentConversation({ name, service }: { name: string; service?: AgentConversationService }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [state, setState] = useState<"ready" | "sending" | "error">("ready");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const status = service ? state : "unconfigured";

  async function send() {
    const message = draft.trim();
    if (!service || !message || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState("sending");
    try {
      const response = await service.send({ message, signal: controller.signal });
      if (controller.signal.aborted) return;
      if (response.role !== "assistant" || !response.content.trim()) throw new Error("Invalid response");
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: "user", content: message }, response]);
      setDraft("");
      setState("ready");
    } catch {
      if (!controller.signal.aborted) setState("error");
    } finally {
      request.current = null;
    }
  }

  return <section className="agent-panel agent-conversation" aria-labelledby="conversation-title">
    <p className="eyebrow">Conversación</p>
    <h2 id="conversation-title">Tu próxima idea empieza aquí</h2>
    <p>{name}, este será tu espacio para convertir preguntas en avances.</p>
    <p role="status">{status === "unconfigured" ? "Agente no configurado. La conversación estará disponible cuando se conecte el servicio." : status === "sending" ? "Enviando consulta…" : status === "error" ? "No se pudo completar la consulta. Puedes reintentar." : "Agente disponible"}</p>
    {!messages.length && <div className="agent-conversation-empty"><span className="agent-orbit" aria-hidden="true"><Sparkles size={34} /></span><h3>Un nuevo punto de partida</h3><p>Trae una pregunta, un documento o un reto de tu cargo.</p><span className="agent-connection-note"><LockKeyhole size={13} aria-hidden="true" /> {service ? "Conversación disponible" : "Disponible al conectar el agente"}</span></div>}
    <div className="agent-messages" role="log" aria-label="Conversación con el agente">
      {messages.map(message => <div key={message.id}><strong>{message.role === "user" ? "Tú" : "Mi agente"}</strong><p>{message.content}</p></div>)}
    </div>
    <form onSubmit={event => { event.preventDefault(); void send(); }}>
      <label htmlFor="agent-query">Tu consulta</label>
      <textarea id="agent-query" placeholder="Escribe tu consulta…" value={draft} onChange={event => setDraft(event.target.value)} disabled={!service || state === "sending"} maxLength={8000} rows={4} aria-describedby="agent-disclaimer" />
      <button className="export-button" type="submit" disabled={!service || state === "sending" || !draft.trim()}>{state === "sending" ? "Enviando…" : state === "error" ? "Reintentar consulta" : "Enviar consulta"}<ArrowUp size={17} aria-hidden="true" /></button>
    </form>
    <small id="agent-disclaimer">El agente puede cometer errores. Verifica la información importante.</small>
  </section>;
}
