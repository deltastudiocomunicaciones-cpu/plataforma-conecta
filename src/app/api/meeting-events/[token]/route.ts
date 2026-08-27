import { NextResponse } from "next/server";
import { hashMeetingToken, toPublicMeeting } from "@/lib/conecta/meetings";
import { sendRocketChatAlert } from "@/lib/conecta/rocket-chat";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PublicResponsePayload = {
  answer?: string;
  fullName?: string;
  requirements?: string;
  role?: string;
  website?: string;
};

type RouteContext = {
  params: Promise<{ token: string }>;
};

async function findMeeting(token: string) {
  if (!token || token.length < 24 || token.length > 96) {
    return { error: NextResponse.json({ ok: false, error: "El enlace de convocatoria no es valido." }, { status: 400 }) };
  }

  const supabase = createSupabaseAdminClient() as any;
  const tokenHash = hashMeetingToken(token);
  const { data: event, error } = await supabase
    .from("meeting_events")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ ok: false, error: error.message }, { status: 500 }) };
  }

  if (!event) {
    return { error: NextResponse.json({ ok: false, error: "Esta convocatoria no existe, fue cerrada o el enlace expiro." }, { status: 404 }) };
  }

  if (event.expires_at && new Date(event.expires_at).getTime() < Date.now()) {
    return { error: NextResponse.json({ ok: false, error: "Esta convocatoria ya expiro." }, { status: 410 }) };
  }

  return { event, supabase };
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const result = await findMeeting(token);
  if (result.error) return result.error;

  return NextResponse.json({ ok: true, meeting: toPublicMeeting(result.event) });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const result = await findMeeting(token);
  if (result.error) return result.error;

  const payload = (await request.json()) as PublicResponsePayload;

  if (payload.website) {
    return NextResponse.json({ ok: true });
  }

  const answer = payload.answer || "confirmada";
  const allowedAnswers = new Set(["confirmada", "virtual", "pendiente", "rechazada"]);
  const fullName = payload.fullName?.trim();
  const roleLabel = payload.role?.trim();

  if (!fullName || !roleLabel || !allowedAnswers.has(answer)) {
    return NextResponse.json({ ok: false, error: "Nombre, cargo y respuesta valida son obligatorios." }, { status: 400 });
  }

  const supabase = result.supabase as any;
  const { data: response, error } = await supabase
    .from("meeting_responses")
    .insert({
      answer,
      full_name: fullName.slice(0, 160),
      meeting_event_id: result.event.id,
      requirements: payload.requirements?.trim().slice(0, 1200) || null,
      role_label: roleLabel.slice(0, 160),
      source: "public_link",
    })
    .select("id, answer, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  try {
    await sendRocketChatAlert({
      actorName: fullName,
      comment: "Respuesta registrada por enlace privado. Revisar observaciones dentro de Plataforma Conecta.",
      message: `Nueva respuesta de convocatoria: ${answer}.`,
      priority: answer === "rechazada" ? "Alta" : "Media",
      recipientLabel: result.event.owner_label,
      responsibleName: roleLabel,
      roleTitle: result.event.name,
      status: answer,
      type: "test",
      url: new URL("/convocatorias", request.url).toString(),
      week: `${result.event.event_date} · ${String(result.event.start_time).slice(0, 5)}`,
    });
  } catch {
    // La respuesta del empleado no debe fallar si el timbre operativo esta temporalmente caido.
  }

  return NextResponse.json({ ok: true, response });
}
