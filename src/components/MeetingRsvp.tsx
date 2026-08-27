"use client";

import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Coffee,
  Copy,
  DollarSign,
  FileCheck2,
  Link2,
  MailCheck,
  RefreshCw,
  Send,
  Users,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const currency = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

const todayIso = new Date().toISOString().slice(0, 10);

type MeetingCounts = {
  confirmada: number;
  pendiente: number;
  rechazada: number;
  virtual: number;
};

type MeetingEventSummary = {
  id: string;
  name: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  owner_label: string;
  audience_label: string;
  modality: string;
  expected_guests: number;
  quorum_percent: number;
  status: string;
  counts: MeetingCounts;
};

type MeetingResponseSummary = {
  id: string;
  meeting_event_id: string;
  full_name: string;
  role_label: string;
  answer: "confirmada" | "virtual" | "pendiente" | "rechazada";
  requirements: string | null;
  created_at: string;
};

function addDaysIso(date: string, days: number) {
  if (!date) return "Por definir";
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function subtractDaysIso(date: string, days: number) {
  if (!date) return "Por definir";
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() - days);
  return value.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizeCounts(counts?: Partial<MeetingCounts>): MeetingCounts {
  return {
    confirmada: counts?.confirmada || 0,
    pendiente: counts?.pendiente || 0,
    rechazada: counts?.rechazada || 0,
    virtual: counts?.virtual || 0,
  };
}

export function MeetingRsvp() {
  const [meetingName, setMeetingName] = useState("Comité de seguimiento Conecta");
  const [meetingDate, setMeetingDate] = useState(todayIso);
  const [meetingStartTime, setMeetingStartTime] = useState("09:00");
  const [meetingEndTime, setMeetingEndTime] = useState("11:00");
  const [meetingOwner, setMeetingOwner] = useState("Gerencia convocante");
  const [meetingAudience, setMeetingAudience] = useState("Equipo convocado");
  const [meetingModality, setMeetingModality] = useState("presencial");
  const [meetingAddress, setMeetingAddress] = useState("Dirección por confirmar");
  const [meetingPhone, setMeetingPhone] = useState("Contacto por confirmar");
  const [meetingLocationUrl, setMeetingLocationUrl] = useState("");
  const [meetingTopics, setMeetingTopics] = useState("Seguimiento de compromisos; revisión de avances; decisiones requeridas");
  const [expectedGuests, setExpectedGuests] = useState(20);
  const [quorumPercent, setQuorumPercent] = useState(70);
  const [foodPlan, setFoodPlan] = useState("refrigerio");
  const [venueCost, setVenueCost] = useState(0);
  const [equipmentCost, setEquipmentCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [notes, setNotes] = useState("Confirmar disponibilidad de salón, ayudas audiovisuales y responsable logístico.");
  const [webhookNotice, setWebhookNotice] = useState("");
  const [employeeNotice, setEmployeeNotice] = useState("");
  const [eventNotice, setEventNotice] = useState("");
  const [savedInviteUrl, setSavedInviteUrl] = useState("");
  const [savedEventId, setSavedEventId] = useState("");
  const [meetingEvents, setMeetingEvents] = useState<MeetingEventSummary[]>([]);
  const [meetingResponses, setMeetingResponses] = useState<MeetingResponseSummary[]>([]);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const selectedEvent = meetingEvents.find((event) => event.id === savedEventId) || meetingEvents[0];
  const selectedCounts = normalizeCounts(selectedEvent?.counts);
  const confirmedGuests = selectedEvent ? selectedCounts.confirmada + selectedCounts.virtual : 0;
  const declinedGuests = selectedEvent ? selectedCounts.rechazada : 0;
  const pendingGuests = selectedEvent
    ? Math.max((selectedEvent.expected_guests || 0) - confirmedGuests - declinedGuests, 0)
    : Math.max(expectedGuests, 0);
  const effectiveExpectedGuests = selectedEvent?.expected_guests || expectedGuests;
  const effectiveQuorumPercent = selectedEvent?.quorum_percent || quorumPercent;
  const requiredGuests = Math.ceil(effectiveExpectedGuests * (effectiveQuorumPercent / 100));
  const quorumProgress = effectiveExpectedGuests > 0 ? Math.min(Math.round((confirmedGuests / effectiveExpectedGuests) * 100), 100) : 0;
  const hasQuorum = confirmedGuests >= requiredGuests;

  const foodCostPerPerson = useMemo(() => {
    if (foodPlan === "almuerzo") return 30000;
    if (foodPlan === "completo") return 50000;
    if (foodPlan === "ninguno") return 0;
    return 20000;
  }, [foodPlan]);

  const foodTotal = confirmedGuests * foodCostPerPerson;
  const logisticsTotal = foodTotal + venueCost + equipmentCost + otherCost;
  const treasuryDeadline = subtractDaysIso(meetingDate, 7);
  const reminderDate = subtractDaysIso(meetingDate, 3);
  const meetingDateLabel = addDaysIso(meetingDate, 0);
  const selectedResponses = meetingResponses.filter((response) => response.meeting_event_id === selectedEvent?.id);

  async function getSessionToken() {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  }

  async function loadMeetingEvents(nextSelectedId = savedEventId) {
    setIsLoadingMeetings(true);
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch("/api/meeting-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) throw new Error(result?.error || "No se pudieron cargar convocatorias.");

      const events = (result.events || []) as MeetingEventSummary[];
      setMeetingEvents(events);
      setMeetingResponses((result.responses || []) as MeetingResponseSummary[]);
      if (!nextSelectedId && events[0]?.id) setSavedEventId(events[0].id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar convocatorias.";
      setEventNotice(message);
    } finally {
      setIsLoadingMeetings(false);
    }
  }

  useEffect(() => {
    void loadMeetingEvents("");
  }, []);

  async function saveMeetingAndCopyLink() {
    setIsSavingMeeting(true);
    setEventNotice("Guardando convocatoria y generando enlace seguro...");
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Ingresa primero a Plataforma Conecta para crear convocatorias reales.");

      const response = await fetch("/api/meeting-events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: meetingAddress,
          audience: meetingAudience,
          date: meetingDate,
          endTime: meetingEndTime,
          equipmentCost,
          expectedGuests,
          foodPlan,
          locationUrl: meetingLocationUrl,
          meetingName,
          modality: meetingModality,
          notes,
          otherCost,
          owner: meetingOwner,
          phone: meetingPhone,
          quorumPercent,
          startTime: meetingStartTime,
          topics: meetingTopics,
          venueCost,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) throw new Error(result?.error || "No se pudo guardar la convocatoria.");

      const inviteUrl = `${window.location.origin}/convocatorias/responder?token=${result.token}`;
      setSavedInviteUrl(inviteUrl);
      setSavedEventId(result.event.id);
      await navigator.clipboard.writeText(inviteUrl);
      setEventNotice("Convocatoria guardada. Enlace seguro copiado para enviar al empleado.");
      await loadMeetingEvents(result.event.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la convocatoria.";
      setEventNotice(message);
    } finally {
      setIsSavingMeeting(false);
    }
  }

  async function copyInviteLink() {
    if (!savedInviteUrl) {
      await saveMeetingAndCopyLink();
      return;
    }

    try {
      await navigator.clipboard.writeText(savedInviteUrl);
      setEmployeeNotice("Link seguro copiado. El convocado verá solo el formato público de respuesta.");
    } catch {
      setEmployeeNotice(`Link seguro: ${savedInviteUrl}`);
    }
  }

  async function sendMeetingWebhookPilot() {
    setIsSendingWebhook(true);
    setWebhookNotice("Enviando convocatoria piloto a Rocket.Chat...");

    try {
      const token = await getSessionToken();
      if (!token) {
        setWebhookNotice("Ingresa primero a Plataforma Conecta para enviar alertas reales.");
        return;
      }

      const response = await fetch("/api/rocket-chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "test",
          actorName: "Convocatorias Conecta",
          roleTitle: selectedEvent?.name || meetingName,
          responsibleName: "Equipo convocante",
          recipientLabel: "Dirección / Tesorería",
          destinations: ["direction", "treasury"],
          status: hasQuorum ? "Reunión viable" : "Esperando quórum",
          priority: hasQuorum ? "Media" : "Alta",
          week: `${meetingDateLabel} · ${meetingStartTime} a ${meetingEndTime}`,
          message: `Convocatoria piloto: ${confirmedGuests} de ${effectiveExpectedGuests} personas confirmadas. Mínimo requerido: ${requiredGuests}. Presupuesto estimado: ${currency.format(logisticsTotal)}. Solicitud a tesorería antes del ${treasuryDeadline}.`,
          comment: `Link de respuesta: ${savedInviteUrl || "Pendiente por guardar"}. ${notes}`,
          url: `${window.location.origin}/convocatorias`,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) {
        const failed = Array.isArray(result?.results)
          ? result.results.filter((item: { ok?: boolean }) => !item.ok)
          : [];
        const detail = failed.length
          ? failed.map((item: { target?: string; reason?: string }) => `${item.target || "destino"}: ${item.reason || "falló"}`).join(" | ")
          : result?.error;
        throw new Error(detail || "No se pudo enviar la convocatoria.");
      }
      setWebhookNotice(result?.skipped ? "Webhook pendiente de configurar en Vercel." : "Convocatoria enviada a Rocket.Chat.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo enviar la convocatoria.";
      setWebhookNotice(`Rocket.Chat: ${message}`);
    } finally {
      setIsSendingWebhook(false);
    }
  }

  return (
    <main className="meeting-rsvp-page">
      <header className="meeting-rsvp-nav">
        <Link href="/mapa-vivo">
          <ArrowLeft aria-hidden="true" size={18} />
          Volver al Mapa Vivo
        </Link>
        <Image alt="Cultura Conecta" height={210} priority src="/brand/cultura-conecta-logo.png" width={360} />
        <span>Convocatorias Conecta</span>
      </header>

      <section className="meeting-rsvp-hero">
        <div>
          <p className="eyebrow">Reuniones, quórum y logística</p>
          <h1>Convocar también es gobernar el ritmo de la organización.</h1>
          <p>
            Este módulo permite planear una reunión, registrar confirmaciones, proyectar quórum y estimar
            necesidades logísticas antes de activar pagos, recursos o alertas internas.
          </p>
        </div>
        <aside>
          <span>Estado automático</span>
          <strong>{hasQuorum ? "Reunión viable" : "Esperando quórum"}</strong>
          <p>{confirmedGuests} de {effectiveExpectedGuests} personas confirmadas. Mínimo requerido: {requiredGuests}.</p>
        </aside>
      </section>

      <section className="meeting-rsvp-shell">
        <div className="meeting-rsvp-main-column">
          <div className="meeting-rsvp-form-card">
            <div className="meeting-rsvp-section-head">
              <CalendarCheck2 aria-hidden="true" size={22} />
              <div>
                <p className="eyebrow">Datos de convocatoria</p>
                <h2>Configura la reunión</h2>
              </div>
            </div>

            <div className="meeting-rsvp-form-grid">
              <label><span>Nombre de la reunión</span><input value={meetingName} onChange={(event) => setMeetingName(event.target.value)} /></label>
              <label><span>Fecha</span><input type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} /></label>
              <label><span>Hora de inicio</span><input type="time" value={meetingStartTime} onChange={(event) => setMeetingStartTime(event.target.value)} /></label>
              <label><span>Hora de finalización</span><input type="time" value={meetingEndTime} onChange={(event) => setMeetingEndTime(event.target.value)} /></label>
              <label><span>Gerencia convocante</span><input value={meetingOwner} onChange={(event) => setMeetingOwner(event.target.value)} /></label>
              <label><span>Dirigido a</span><input value={meetingAudience} onChange={(event) => setMeetingAudience(event.target.value)} /></label>
              <label><span>Modalidad</span><select value={meetingModality} onChange={(event) => setMeetingModality(event.target.value)}><option value="presencial">Presencial</option><option value="virtual">Virtual</option><option value="hibrida">Híbrida</option></select></label>
              <label><span>Dirección o enlace</span><input value={meetingAddress} onChange={(event) => setMeetingAddress(event.target.value)} /></label>
              <label><span>Teléfono de información</span><input value={meetingPhone} onChange={(event) => setMeetingPhone(event.target.value)} /></label>
              <label><span>Link de ubicación</span><input value={meetingLocationUrl} onChange={(event) => setMeetingLocationUrl(event.target.value)} placeholder="https://..." /></label>
              <label className="meeting-rsvp-form-grid__wide"><span>Temas a tratar o resolver</span><textarea value={meetingTopics} onChange={(event) => setMeetingTopics(event.target.value)} /></label>
              <label><span>Personas convocadas</span><input min="1" type="number" value={expectedGuests} onChange={(event) => setExpectedGuests(Number(event.target.value))} /></label>
              <label><span>Quórum mínimo (%)</span><input min="1" max="100" type="number" value={quorumPercent} onChange={(event) => setQuorumPercent(Number(event.target.value))} /></label>
              <label><span>Atención logística</span><select value={foodPlan} onChange={(event) => setFoodPlan(event.target.value)}><option value="refrigerio">Refrigerio - $20.000 persona</option><option value="almuerzo">Almuerzo - $30.000 persona</option><option value="completo">Refrigerio + almuerzo - $50.000 persona</option><option value="ninguno">Sin atención logística</option></select></label>
              <label><span>Valor del salón</span><input min="0" type="number" value={venueCost} onChange={(event) => setVenueCost(Number(event.target.value))} /></label>
              <label><span>Valor alquiler de equipos</span><input min="0" type="number" value={equipmentCost} onChange={(event) => setEquipmentCost(Number(event.target.value))} /></label>
              <label><span>Otros gastos</span><input min="0" type="number" value={otherCost} onChange={(event) => setOtherCost(Number(event.target.value))} /></label>
            </div>

            <label className="meeting-rsvp-notes"><span>Notas logísticas internas</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>

            <div className="meeting-rsvp-generated-link">
              <Link2 aria-hidden="true" size={17} />
              <span>{savedInviteUrl || "Guarda la convocatoria para generar el enlace privado del empleado."}</span>
            </div>
            <div className="meeting-rsvp-action-row">
              <button className="meeting-rsvp-copy-button" disabled={isSavingMeeting} onClick={saveMeetingAndCopyLink} type="button">
                <Copy aria-hidden="true" size={16} />
                {isSavingMeeting ? "Guardando..." : "Guardar y copiar link"}
              </button>
              <button className="meeting-rsvp-secondary-button" disabled={isLoadingMeetings} onClick={() => loadMeetingEvents()} type="button">
                <RefreshCw aria-hidden="true" size={16} />
                Actualizar respuestas
              </button>
            </div>
            {eventNotice ? <p className="meeting-rsvp-copy-notice">{eventNotice}</p> : null}
          </div>

          <div className="meeting-rsvp-employee-flow">
            <div className="meeting-rsvp-section-head">
              <FileCheck2 aria-hidden="true" size={22} />
              <div>
                <p className="eyebrow">Vista segura del convocado</p>
                <h2>El empleado recibe solo lo necesario</h2>
              </div>
            </div>

            <div className="meeting-rsvp-employee-grid">
              <div className="meeting-rsvp-invite-card">
                <span className="meeting-rsvp-badge">Link privado de asistencia</span>
                <h3>{meetingName}</h3>
                <p>
                  El enlace público muestra gerencia convocante, fecha, horario, lugar, modalidad, temas y observaciones.
                  No expone costos, quórum, logística interna ni panel administrativo.
                </p>
                <div className="meeting-rsvp-review-list">
                  <span><strong>01</strong><em>Convocatoria</em><small>El empleado recibe un enlace privado con fecha, horario, lugar, temas y contacto.</small></span>
                  <span><strong>02</strong><em>Respuesta segura</em><small>Confirma asistencia presencial, virtual, pendiente o no asistencia sin ver datos internos.</small></span>
                  <span><strong>03</strong><em>Consolidado interno</em><small>Dirección o gerencia revisa resultados para aprobar logística y notificar a Tesorería.</small></span>
                </div>
                <button className="meeting-rsvp-copy-button" onClick={copyInviteLink} type="button">
                  <Copy aria-hidden="true" size={16} />
                  Copiar enlace seguro
                </button>
                {employeeNotice ? <p className="meeting-rsvp-copy-notice">{employeeNotice}</p> : null}
              </div>

              <div className="meeting-rsvp-review-card">
                <span className="meeting-rsvp-badge">Resultados consolidados</span>
                <h3>{selectedEvent?.name || "Sin convocatoria seleccionada"}</h3>
                <p className="meeting-rsvp-review-card__lead">Lectura interna para definir quórum, modalidad y preparación logística.</p>
                <div className="meeting-rsvp-live-results" aria-label="Resumen de respuestas de la convocatoria">
                  <article><strong>{selectedCounts.confirmada}</strong><span>Presencial</span></article>
                  <article><strong>{selectedCounts.virtual}</strong><span>Virtual</span></article>
                  <article><strong>{selectedCounts.pendiente}</strong><span>Pendiente</span></article>
                  <article><strong>{selectedCounts.rechazada}</strong><span>No asistiré</span></article>
                </div>
                <div className="meeting-rsvp-response-log">
                  {selectedResponses.length ? selectedResponses.slice(0, 6).map((response) => (
                    <article key={response.id}>
                      <strong>{response.full_name}</strong>
                      <span>{response.role_label} · {response.answer}</span>
                    </article>
                  )) : <p>Aún no hay respuestas registradas para esta convocatoria.</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="meeting-rsvp-events-card">
            <div className="meeting-rsvp-section-head">
              <ClipboardList aria-hidden="true" size={22} />
              <div>
                <p className="eyebrow">Convocatorias guardadas</p>
                <h2>Historial operativo</h2>
              </div>
            </div>
            <div className="meeting-rsvp-events-list">
              {meetingEvents.length ? meetingEvents.map((event) => {
                const counts = normalizeCounts(event.counts);
                const total = counts.confirmada + counts.virtual + counts.pendiente + counts.rechazada;
                return (
                  <button className={event.id === selectedEvent?.id ? "is-active" : ""} key={event.id} onClick={() => setSavedEventId(event.id)} type="button">
                    <strong>{event.name}</strong>
                    <span>{event.owner_label} · {event.event_date} · {total} respuestas</span>
                  </button>
                );
              }) : <p>No hay convocatorias guardadas todavía.</p>}
            </div>
          </div>
        </div>

        <aside className="meeting-rsvp-summary">
          <div className="meeting-rsvp-summary__top"><span>Informe preliminar</span><strong>{meetingName}</strong><p>{meetingDateLabel} · {meetingStartTime} a {meetingEndTime}</p></div>
          <div className="meeting-rsvp-progress" aria-label="Avance de quórum"><div style={{ width: `${quorumProgress}%` }} /></div>
          <div className="meeting-rsvp-metrics">
            <article><Users aria-hidden="true" size={18} /><small>Confirmadas</small><strong>{confirmedGuests}</strong></article>
            <article><ClipboardList aria-hidden="true" size={18} /><small>Pendientes</small><strong>{pendingGuests}</strong></article>
            <article><CheckCircle2 aria-hidden="true" size={18} /><small>Quórum</small><strong>{quorumProgress}%</strong></article>
          </div>
          <div className="meeting-rsvp-logistics">
            <h3>Proyección logística</h3>
            <p><Coffee aria-hidden="true" size={16} /> Atención por persona: {currency.format(foodCostPerPerson)}</p>
            <p><Utensils aria-hidden="true" size={16} /> Total atención: {currency.format(foodTotal)}</p>
            <div className="meeting-rsvp-cost-breakdown"><span>Salón <strong>{currency.format(venueCost)}</strong></span><span>Equipos <strong>{currency.format(equipmentCost)}</strong></span><span>Otros <strong>{currency.format(otherCost)}</strong></span></div>
            <p><DollarSign aria-hidden="true" size={16} /> Presupuesto estimado: {currency.format(logisticsTotal)}</p>
          </div>
          <div className="meeting-rsvp-alert-box"><MailCheck aria-hidden="true" size={20} /><div><span>Alerta a Tesorería</span><p>Enviar solicitud presupuestal antes del {treasuryDeadline}. Recordatorio operativo: {reminderDate}.</p></div></div>
          <button disabled={isSendingWebhook} onClick={sendMeetingWebhookPilot} type="button"><Send aria-hidden="true" size={17} />{isSendingWebhook ? "Enviando alerta..." : "Enviar convocatoria piloto"}</button>
          {webhookNotice ? <p className="meeting-rsvp-webhook-notice">{webhookNotice}</p> : null}
        </aside>
      </section>
    </main>
  );
}


