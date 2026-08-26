"use client";

import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Coffee,
  DollarSign,
  MailCheck,
  Send,
  Users,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const [notes, setNotes] = useState("Confirmar disponibilidad de salón, ayudas audiovisuales y responsable logístico.");

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
  const logisticsTotal = foodTotal + venueCost + equipmentCost;
  const treasuryDeadline = subtractDaysIso(meetingDate, 7);
  const reminderDate = subtractDaysIso(meetingDate, 3);
  const meetingDateLabel = addDaysIso(meetingDate, 0);

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
              <span>Salón / espacio</span>
              <input min="0" type="number" value={venueCost} onChange={(event) => setVenueCost(Number(event.target.value))} />
            </label>
            <label>
              <span>Equipos / logística adicional</span>
              <input min="0" type="number" value={equipmentCost} onChange={(event) => setEquipmentCost(Number(event.target.value))} />
            </label>
          </div>

          <label className="meeting-rsvp-notes">
            <span>Notas logísticas</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
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
            <p><DollarSign aria-hidden="true" size={16} /> Presupuesto estimado: {currency.format(logisticsTotal)}</p>
          </div>

          <div className="meeting-rsvp-alert-box">
            <MailCheck aria-hidden="true" size={20} />
            <div>
              <span>Alerta a tesorería</span>
              <p>Enviar solicitud presupuestal antes del {treasuryDeadline}. Recordatorio operativo: {reminderDate}.</p>
            </div>
          </div>

          <button type="button">
            <Send aria-hidden="true" size={17} />
            Generar convocatoria piloto
          </button>
        </aside>
      </section>
    </main>
  );
}
