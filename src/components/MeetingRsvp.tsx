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
  MailCheck,
  Send,
  Users,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const currency = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

const todayIso = new Date().toISOString().slice(0, 10);

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

export function MeetingRsvp() {
  const [meetingName, setMeetingName] = useState("Comité de seguimiento Conecta");
  const [meetingDate, setMeetingDate] = useState(todayIso);
  const [meetingTime, setMeetingTime] = useState("09:00");
  const [expectedGuests, setExpectedGuests] = useState(20);
  const [confirmedGuests, setConfirmedGuests] = useState(12);
  const [declinedGuests, setDeclinedGuests] = useState(2);
  const [quorumPercent, setQuorumPercent] = useState(70);
  const [foodPlan, setFoodPlan] = useState("refrigerio");
  const [venueCost, setVenueCost] = useState(0);
  const [equipmentCost, setEquipmentCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [notes, setNotes] = useState("Confirmar disponibilidad de salón, ayudas audiovisuales y responsable logístico.");
  const [inviteeName, setInviteeName] = useState("María Fernanda");
  const [inviteeRole, setInviteeRole] = useState("Responsable de área");
  const [inviteeAnswer, setInviteeAnswer] = useState("confirmada");
  const [inviteeNotes, setInviteeNotes] = useState("Sin restricciones alimentarias. Requiere parqueadero.");
  const [webhookNotice, setWebhookNotice] = useState("");
  const [employeeNotice, setEmployeeNotice] = useState("");
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const pendingGuests = Math.max(expectedGuests - confirmedGuests - declinedGuests, 0);
  const requiredGuests = Math.ceil(expectedGuests * (quorumPercent / 100));
  const quorumProgress = expectedGuests > 0 ? Math.min(Math.round((confirmedGuests / expectedGuests) * 100), 100) : 0;
  const hasQuorum = confirmedGuests >= requiredGuests;

  const foodCostPerPerson = useMemo(() => {
    if (foodPlan === "almuerzo") return 30000;
    if (foodPlan === "completo") return 50000;
    return 20000;
  }, [foodPlan]);

  const foodTotal = confirmedGuests * foodCostPerPerson;
  const logisticsTotal = foodTotal + venueCost + equipmentCost + otherCost;
  const treasuryDeadline = subtractDaysIso(meetingDate, 7);
  const reminderDate = subtractDaysIso(meetingDate, 3);
  const meetingDateLabel = addDaysIso(meetingDate, 0);

  async function copyInviteLink() {
    const inviteUrl = `${window.location.origin}/convocatorias/responder?evento=demo-conecta`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setEmployeeNotice("Link piloto copiado. En la fase backend este enlace quedará asociado a una convocatoria real.");
    } catch {
      setEmployeeNotice(`Link piloto: ${inviteUrl}`);
    }
  }

  async function sendMeetingWebhookPilot() {
    setIsSendingWebhook(true);
    setWebhookNotice("Enviando convocatoria piloto a Rocket.Chat...");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setWebhookNotice("Ingresa primero a Plataforma Conecta para enviar alertas reales.");
        return;
      }

      const response = await fetch("/api/rocket-chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "test",
          actorName: "Convocatorias Conecta",
          roleTitle: meetingName,
          responsibleName: "Equipo convocante",
          recipientLabel: "Gerencia / Dirección / Tesorería",
          status: hasQuorum ? "Reunión viable" : "Esperando quórum",
          priority: hasQuorum ? "Media" : "Alta",
          week: `${meetingDateLabel} · ${meetingTime}`,
          message: `Convocatoria piloto: ${confirmedGuests} de ${expectedGuests} personas confirmadas. Mínimo requerido: ${requiredGuests}. Presupuesto estimado: ${currency.format(logisticsTotal)}. Solicitud a tesorería antes del ${treasuryDeadline}.`,
          comment: `${notes} Salón: ${currency.format(venueCost)}. Equipos: ${currency.format(equipmentCost)}. Otros: ${currency.format(otherCost)}. Atención: ${currency.format(foodTotal)}.`,
          url: `${window.location.origin}/convocatorias`,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || "No se pudo enviar la convocatoria.");
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
          <p>{confirmedGuests} de {expectedGuests} personas confirmadas. Mínimo requerido: {requiredGuests}.</p>
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
              <label>
                <span>Nombre de la reunión</span>
                <input value={meetingName} onChange={(event) => setMeetingName(event.target.value)} />
              </label>
              <label>
                <span>Fecha</span>
                <input type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} />
              </label>
              <label>
                <span>Hora</span>
                <input type="time" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} />
              </label>
              <label>
                <span>Personas convocadas</span>
                <input min="1" type="number" value={expectedGuests} onChange={(event) => setExpectedGuests(Number(event.target.value))} />
              </label>
              <label>
                <span>Confirmadas</span>
                <input min="0" type="number" value={confirmedGuests} onChange={(event) => setConfirmedGuests(Number(event.target.value))} />
              </label>
              <label>
                <span>No asisten</span>
                <input min="0" type="number" value={declinedGuests} onChange={(event) => setDeclinedGuests(Number(event.target.value))} />
              </label>
              <label>
                <span>Quórum mínimo (%)</span>
                <input min="1" max="100" type="number" value={quorumPercent} onChange={(event) => setQuorumPercent(Number(event.target.value))} />
              </label>
              <label>
                <span>Atención logística</span>
                <select value={foodPlan} onChange={(event) => setFoodPlan(event.target.value)}>
                  <option value="refrigerio">Refrigerio - $20.000 persona</option>
                  <option value="almuerzo">Almuerzo - $30.000 persona</option>
                  <option value="completo">Refrigerio + almuerzo - $50.000 persona</option>
                </select>
              </label>
              <label>
                <span>Valor del salón</span>
                <input min="0" type="number" value={venueCost} onChange={(event) => setVenueCost(Number(event.target.value))} />
              </label>
              <label>
                <span>Valor alquiler de equipos</span>
                <input min="0" type="number" value={equipmentCost} onChange={(event) => setEquipmentCost(Number(event.target.value))} />
              </label>
              <label>
                <span>Otros gastos</span>
                <input min="0" type="number" value={otherCost} onChange={(event) => setOtherCost(Number(event.target.value))} />
              </label>
            </div>

            <label className="meeting-rsvp-notes">
              <span>Notas logísticas</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </div>

          <div className="meeting-rsvp-employee-flow">
            <div className="meeting-rsvp-section-head">
              <FileCheck2 aria-hidden="true" size={22} />
              <div>
                <p className="eyebrow">Respuesta previa del convocado</p>
                <h2>Formato que recibe el empleado</h2>
              </div>
            </div>

            <div className="meeting-rsvp-employee-grid">
              <div className="meeting-rsvp-invite-card">
                <span className="meeting-rsvp-badge">Link privado de asistencia</span>
                <h3>Hola, {inviteeName}</h3>
                <p>
                  Confirma tu asistencia a <strong>{meetingName}</strong>. Tu respuesta alimenta el quórum,
                  la logística y la solicitud previa a Tesorería.
                </p>
                <div className="meeting-rsvp-mini-form">
                  <label>
                    <span>Nombre</span>
                    <input value={inviteeName} onChange={(event) => setInviteeName(event.target.value)} />
                  </label>
                  <label>
                    <span>Cargo / área</span>
                    <input value={inviteeRole} onChange={(event) => setInviteeRole(event.target.value)} />
                  </label>
                  <label>
                    <span>Respuesta</span>
                    <select value={inviteeAnswer} onChange={(event) => setInviteeAnswer(event.target.value)}>
                      <option value="confirmada">Asisto</option>
                      <option value="pendiente">Pendiente por confirmar</option>
                      <option value="rechazada">No puedo asistir</option>
                    </select>
                  </label>
                  <label>
                    <span>Observaciones</span>
                    <textarea value={inviteeNotes} onChange={(event) => setInviteeNotes(event.target.value)} />
                  </label>
                </div>
                <button className="meeting-rsvp-copy-button" onClick={copyInviteLink} type="button">
                  <Copy aria-hidden="true" size={16} />
                  Copiar enlace piloto
                </button>
                {employeeNotice ? <p className="meeting-rsvp-copy-notice">{employeeNotice}</p> : null}
              </div>

              <div className="meeting-rsvp-review-card">
                <span className="meeting-rsvp-badge">Vista del superadmin</span>
                <h3>Revisión antes de Tesorería</h3>
                <p>
                  El superadmin valida asistencia, necesidades logísticas, presupuesto y fecha límite antes de escalar
                  la convocatoria como solicitud formal.
                </p>
                <div className="meeting-rsvp-review-list">
                  <span><strong>01</strong> Respuestas recibidas por enlace privado.</span>
                  <span><strong>02</strong> Quórum calculado automáticamente.</span>
                  <span><strong>03</strong> Costos consolidados para aprobación.</span>
                  <span><strong>04</strong> Alerta final a gerencia, dirección o Tesorería.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="meeting-rsvp-summary">
          <div className="meeting-rsvp-summary__top">
            <span>Informe preliminar</span>
            <strong>{meetingName}</strong>
            <p>{meetingDateLabel} · {meetingTime}</p>
          </div>

          <div className="meeting-rsvp-progress" aria-label="Avance de quórum">
            <div style={{ width: `${quorumProgress}%` }} />
          </div>

          <div className="meeting-rsvp-metrics">
            <article>
              <Users aria-hidden="true" size={18} />
              <small>Confirmadas</small>
              <strong>{confirmedGuests}</strong>
            </article>
            <article>
              <ClipboardList aria-hidden="true" size={18} />
              <small>Pendientes</small>
              <strong>{pendingGuests}</strong>
            </article>
            <article>
              <CheckCircle2 aria-hidden="true" size={18} />
              <small>Quórum</small>
              <strong>{quorumProgress}%</strong>
            </article>
          </div>

          <div className="meeting-rsvp-logistics">
            <h3>Proyección logística</h3>
            <p><Coffee aria-hidden="true" size={16} /> Atención por persona: {currency.format(foodCostPerPerson)}</p>
            <p><Utensils aria-hidden="true" size={16} /> Total atención: {currency.format(foodTotal)}</p>
            <div className="meeting-rsvp-cost-breakdown">
              <span>Salón <strong>{currency.format(venueCost)}</strong></span>
              <span>Equipos <strong>{currency.format(equipmentCost)}</strong></span>
              <span>Otros <strong>{currency.format(otherCost)}</strong></span>
            </div>
            <p><DollarSign aria-hidden="true" size={16} /> Presupuesto estimado: {currency.format(logisticsTotal)}</p>
          </div>

          <div className="meeting-rsvp-alert-box">
            <MailCheck aria-hidden="true" size={20} />
            <div>
              <span>Alerta a Tesorería</span>
              <p>Enviar solicitud presupuestal antes del {treasuryDeadline}. Recordatorio operativo: {reminderDate}.</p>
            </div>
          </div>

          <button disabled={isSendingWebhook} onClick={sendMeetingWebhookPilot} type="button">
            <Send aria-hidden="true" size={17} />
            {isSendingWebhook ? "Enviando alerta..." : "Enviar convocatoria piloto"}
          </button>
          {webhookNotice ? <p className="meeting-rsvp-webhook-notice">{webhookNotice}</p> : null}
        </aside>
      </section>
    </main>
  );
}
