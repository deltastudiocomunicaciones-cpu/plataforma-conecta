"use client";

import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquareText,
  MonitorSmartphone,
  Phone,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MeetingPublicEvent = {
  address: string;
  audience: string;
  date: string;
  endTime: string;
  locationUrl: string;
  meetingName: string;
  modality: string;
  notes: string;
  owner: string;
  phone: string;
  startTime: string;
  topics: string[];
};

const demoMeeting: MeetingPublicEvent = {
  address: "Dirección por confirmar",
  audience: "Equipo convocado",
  date: "Fecha por confirmar",
  endTime: "11:00",
  locationUrl: "",
  meetingName: "Comité de seguimiento Conecta",
  modality: "Presencial",
  notes: "Indica si necesitas conexión virtual, alguna observación de asistencia o una condición especial para participar.",
  owner: "Gerencia convocante",
  phone: "Contacto por confirmar",
  startTime: "09:00",
  topics: ["Seguimiento de compromisos", "Revisión de avances", "Decisiones requeridas"],
};

export default function MeetingResponsePage() {
  const [token, setToken] = useState("");
  const [meeting, setMeeting] = useState<MeetingPublicEvent>(demoMeeting);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [answer, setAnswer] = useState("confirmada");
  const [requirements, setRequirements] = useState("");
  const [website, setWebsite] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextToken = params.get("token") || "";
    setToken(nextToken);

    if (!nextToken) {
      setIsLoading(false);
      return;
    }

    async function loadMeeting() {
      setIsLoading(true);
      setNotice("");
      try {
        const response = await fetch(`/api/meeting-events/${nextToken}`);
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.ok === false) throw new Error(result?.error || "No se pudo cargar la convocatoria.");
        setMeeting(result.meeting);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar la convocatoria.";
        setNotice(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadMeeting();
  }, []);

  const topics = useMemo(() => (meeting.topics.length ? meeting.topics : ["Tema por confirmar"]), [meeting.topics]);

  async function submitResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");

    try {
      if (!token) {
        setSubmitted(true);
        return;
      }

      const response = await fetch(`/api/meeting-events/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, fullName, requirements, role, website }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) throw new Error(result?.error || "No se pudo registrar la respuesta.");
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo registrar la respuesta.";
      setNotice(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="meeting-response-page">
      <section className="meeting-response-card meeting-response-card--employee">
        <header className="meeting-response-brand">
          <Link href="/">
            <ArrowLeft aria-hidden="true" size={17} />
            Cultura Conecta
          </Link>
          <Image alt="Cultura Conecta" height={130} priority src="/brand/cultura-conecta-logo.png" width={260} />
        </header>

        <div className="meeting-response-hero meeting-response-hero--invite">
          <p className="eyebrow">Invitación privada</p>
          <h1>{isLoading ? "Cargando convocatoria..." : meeting.meetingName}</h1>
          <p>
            Has sido convocado a una reunión de trabajo. Los datos de la convocatoria están cerrados;
            solo debes confirmar tu respuesta y dejar observaciones si aplica.
          </p>
        </div>

        {notice ? <p className="meeting-response-notice">{notice}</p> : null}

        <div className="meeting-response-summary meeting-response-summary--invite">
          <article><MessageSquareText aria-hidden="true" size={18} /><span>Gerencia convocante</span><strong>{meeting.owner}</strong></article>
          <article><Users aria-hidden="true" size={18} /><span>Dirigido a</span><strong>{meeting.audience}</strong></article>
          <article><MonitorSmartphone aria-hidden="true" size={18} /><span>Modalidad</span><strong>{meeting.modality}</strong></article>
          <article><CalendarCheck2 aria-hidden="true" size={18} /><span>Fecha</span><strong>{meeting.date}</strong></article>
          <article><Clock aria-hidden="true" size={18} /><span>Horario</span><strong>{meeting.startTime} a {meeting.endTime || "cierre por confirmar"}</strong></article>
          <article><Phone aria-hidden="true" size={18} /><span>Información</span><strong>{meeting.phone}</strong></article>
        </div>

        <div className="meeting-response-context">
          <article>
            <MapPin aria-hidden="true" size={18} />
            <div>
              <span>Lugar de reunión</span>
              <strong>{meeting.address}</strong>
              {meeting.locationUrl ? <a href={meeting.locationUrl} rel="noreferrer" target="_blank">Abrir ubicación</a> : null}
            </div>
          </article>
          <article>
            <MessageSquareText aria-hidden="true" size={18} />
            <div>
              <span>Temas a tratar o resolver</span>
              <ul>{topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            </div>
          </article>
        </div>

        {submitted ? (
          <div className="meeting-response-success">
            <CheckCircle2 aria-hidden="true" size={34} />
            <div>
              <p className="eyebrow">Respuesta registrada</p>
              <h2>Gracias, {fullName || "convocado"}.</h2>
              <p>Tu respuesta quedó registrada y el equipo responsable podrá revisarla desde Plataforma Conecta.</p>
            </div>
          </div>
        ) : (
          <form className="meeting-response-form" onSubmit={submitResponse}>
            <label className="meeting-response-honeypot" aria-hidden="true">
              <span>Sitio web</span>
              <input tabIndex={-1} value={website} onChange={(event) => setWebsite(event.target.value)} />
            </label>
            <label>
              <span>Nombre completo</span>
              <div><UserRound aria-hidden="true" size={17} /><input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Tu nombre" /></div>
            </label>
            <label><span>Cargo o área</span><input required value={role} onChange={(event) => setRole(event.target.value)} placeholder="Ej. Gestión Cartera" /></label>
            <label><span>Respuesta</span><select value={answer} onChange={(event) => setAnswer(event.target.value)}><option value="confirmada">Confirmo asistencia presencial</option><option value="virtual">Solicito conexión virtual</option><option value="pendiente">Pendiente por confirmar</option><option value="rechazada">No puedo asistir</option></select></label>
            <label className="meeting-response-form__wide"><span>Observaciones</span><textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder={meeting.notes} /></label>
            <button disabled={isSubmitting || isLoading} type="submit"><Send aria-hidden="true" size={17} />{isSubmitting ? "Enviando..." : "Enviar respuesta"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
