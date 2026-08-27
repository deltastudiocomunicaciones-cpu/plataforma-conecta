import { createHash, randomBytes } from "crypto";

export type MeetingPublicEvent = {
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

export function createMeetingToken() {
  return randomBytes(24).toString("base64url");
}

export function hashMeetingToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseTopics(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
  }

  return String(value || "")
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function toPublicMeeting(row: any): MeetingPublicEvent {
  const modalityLabel = row.modality === "hibrida" ? "Híbrida" : row.modality === "virtual" ? "Virtual" : "Presencial";

  return {
    address: row.address || "Lugar por confirmar",
    audience: row.audience_label || "Equipo convocado",
    date: row.event_date || "Fecha por confirmar",
    endTime: row.end_time ? String(row.end_time).slice(0, 5) : "",
    locationUrl: row.location_url || "",
    meetingName: row.name || "Convocatoria Conecta",
    modality: modalityLabel,
    notes:
      row.public_note ||
      "Indica si necesitas conexión virtual, alguna observación de asistencia o una condición especial para participar.",
    owner: row.owner_label || "Gerencia convocante",
    phone: row.phone || "Contacto por confirmar",
    startTime: row.start_time ? String(row.start_time).slice(0, 5) : "",
    topics: Array.isArray(row.topics) ? row.topics : [],
  };
}
