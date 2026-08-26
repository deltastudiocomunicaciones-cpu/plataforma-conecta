"use client";

import { ArrowLeft, CalendarCheck2, CheckCircle2, Clock, MessageSquareText, Send, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function MeetingResponsePage() {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [answer, setAnswer] = useState("confirmada");
  const [requirements, setRequirements] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="meeting-response-page">
      <section className="meeting-response-card">
        <header className="meeting-response-brand">
          <Link href="/convocatorias">
            <ArrowLeft aria-hidden="true" size={17} />
            Volver
          </Link>
          <Image alt="Cultura Conecta" height={130} priority src="/brand/cultura-conecta-logo.png" width={260} />
        </header>

        <div className="meeting-response-hero">
          <p className="eyebrow">Invitación privada</p>
          <h1>Confirma tu asistencia</h1>
          <p>
            Tu respuesta permite calcular quórum, logística, presupuesto y necesidades antes de la reunión.
          </p>
        </div>

        <div className="meeting-response-summary">
          <article>
            <CalendarCheck2 aria-hidden="true" size={18} />
            <span>Reunión</span>
            <strong>Comité de seguimiento Conecta</strong>
          </article>
          <article>
            <Clock aria-hidden="true" size={18} />
            <span>Fecha tentativa</span>
            <strong>Semana en curso · 09:00</strong>
          </article>
          <article>
            <MessageSquareText aria-hidden="true" size={18} />
            <span>Destino</span>
            <strong>Equipo convocante</strong>
          </article>
        </div>

        {submitted ? (
          <div className="meeting-response-success">
            <CheckCircle2 aria-hidden="true" size={34} />
            <div>
              <p className="eyebrow">Respuesta registrada</p>
              <h2>Gracias, {fullName || "convocado"}.</h2>
              <p>
                En la versión conectada, esta respuesta actualizará el quórum y notificará al superadmin para revisión.
              </p>
            </div>
          </div>
        ) : (
          <form
            className="meeting-response-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <label>
              <span>Nombre completo</span>
              <div>
                <UserRound aria-hidden="true" size={17} />
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Tu nombre" />
              </div>
            </label>

            <label>
              <span>Cargo o área</span>
              <input required value={role} onChange={(event) => setRole(event.target.value)} placeholder="Ej. Gestión Cartera" />
            </label>

            <label>
              <span>Respuesta</span>
              <select value={answer} onChange={(event) => setAnswer(event.target.value)}>
                <option value="confirmada">Confirmo asistencia</option>
                <option value="pendiente">Pendiente por confirmar</option>
                <option value="rechazada">No puedo asistir</option>
              </select>
            </label>

            <label className="meeting-response-form__wide">
              <span>Requerimientos u observaciones</span>
              <textarea
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                placeholder="Restricciones alimentarias, parqueadero, conexión virtual, equipo requerido o comentario logístico."
              />
            </label>

            <button type="submit">
              <Send aria-hidden="true" size={17} />
              Enviar respuesta
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
