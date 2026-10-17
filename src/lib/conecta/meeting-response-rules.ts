export type MeetingModality = "presencial" | "virtual" | "hibrida";

export type MeetingAnswer =
  | "confirmada"
  | "virtual"
  | "pendiente"
  | "rechazada";

export function normalizeMeetingModality(
  value: string | null | undefined
): MeetingModality {
  const normalized = (value || "")
    .trim()
    .toLocaleLowerCase("es");

  if (normalized === "virtual") return "virtual";
  if (normalized === "hibrida" || normalized === "híbrida") {
    return "hibrida";
  }

  return "presencial";
}

export function allowedMeetingAnswers(
  modality: MeetingModality
): MeetingAnswer[] {
  switch (modality) {
    case "virtual":
      return ["virtual", "rechazada"];
    case "hibrida":
      return ["confirmada", "virtual", "rechazada"];
    default:
      return ["confirmada", "rechazada"];
  }
}

export function isAllowedMeetingAnswer(
  modality: MeetingModality,
  answer: string
): answer is MeetingAnswer {
  return allowedMeetingAnswers(modality).some(
    (allowed) => allowed === answer
  );
}

export function meetingAnswerLabel(
  answer: MeetingAnswer
): string {
  switch (answer) {
    case "confirmada":
      return "Confirmo asistencia presencial";
    case "virtual":
      return "Confirmo asistencia virtual";
    case "pendiente":
      return "Pendiente por confirmar";
    case "rechazada":
      return "No puedo asistir";
  }
}

export function safeMeetingUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    if (url.username || url.password) return null;

    return url.toString();
  } catch {
    return null;
  }
}
