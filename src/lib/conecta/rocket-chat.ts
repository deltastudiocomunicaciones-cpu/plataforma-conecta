export type RocketChatAlertType =
  | "report_submitted"
  | "report_reviewed"
  | "report_escalated"
  | "test";

export type RocketChatAlertInput = {
  type: RocketChatAlertType;
  actorName?: string;
  roleTitle: string;
  responsibleName?: string;
  recipientLabel?: string;
  status?: string;
  priority?: string;
  week?: string;
  message?: string;
  comment?: string;
  url?: string;
};

type RocketChatField = {
  title: string;
  value: string;
  short?: boolean;
};

type RocketChatPayload = {
  alias: string;
  emoji: string;
  text: string;
  attachments: Array<{
    title: string;
    text: string;
    color: string;
    fields: RocketChatField[];
  }>;
};

const alertConfig: Record<RocketChatAlertType, { title: string; color: string; verb: string }> = {
  report_submitted: {
    title: "Informe de gestion recibido",
    color: "#b8df2d",
    verb: "registro un informe de gestion",
  },
  report_reviewed: {
    title: "Informe revisado",
    color: "#08706e",
    verb: "actualizo la revision de un informe",
  },
  report_escalated: {
    title: "Informe escalado",
    color: "#ff5f2a",
    verb: "escalo un informe para decision",
  },
  test: {
    title: "Prueba de alerta Conecta",
    color: "#06213f",
    verb: "probo el timbre operativo",
  },
};

function cleanValue(value: string | undefined, fallback = "Sin dato") {
  return value?.trim() || fallback;
}

function buildRocketChatPayload(input: RocketChatAlertInput): RocketChatPayload {
  const config = alertConfig[input.type];
  const actor = cleanValue(input.actorName, "Plataforma Conecta");
  const roleTitle = cleanValue(input.roleTitle);
  const recipient = cleanValue(input.recipientLabel, "Destino operativo");
  const status = cleanValue(input.status, "Sin estado");
  const priority = cleanValue(input.priority, "Media");
  const week = cleanValue(input.week, "Periodo actual");
  const message = cleanValue(input.message, "El sistema registro un movimiento operativo.");
  const comment = input.comment?.trim();

  const fields: RocketChatField[] = [
    { title: "Cargo", value: roleTitle, short: true },
    { title: "Responsable", value: cleanValue(input.responsibleName), short: true },
    { title: "Destino", value: recipient, short: true },
    { title: "Estado", value: status, short: true },
    { title: "Periodo", value: week, short: true },
    { title: "Prioridad", value: priority, short: true },
  ];

  if (comment) {
    fields.push({ title: "Comentario de revision", value: comment, short: false });
  }

  if (input.url) {
    fields.push({ title: "Abrir plataforma", value: input.url, short: false });
  }

  return {
    alias: "Plataforma Conecta",
    emoji: ":bell:",
    text: `*${config.title}*`,
    attachments: [
      {
        title: `${actor} ${config.verb}`,
        text: message,
        color: config.color,
        fields,
      },
    ],
  };
}

export async function sendRocketChatAlert(input: RocketChatAlertInput) {
  const webhookUrl = process.env.ROCKET_CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: true,
      delivered: false,
      skipped: true,
      reason: "ROCKET_CHAT_WEBHOOK_URL no esta configurada.",
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRocketChatPayload(input)),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Rocket.Chat respondio con estado ${response.status}.`);
  }

  return {
    ok: true,
    delivered: true,
    skipped: false,
  };
}
