import { NextResponse } from "next/server";
import { createMeetingToken, hashMeetingToken, parseTopics } from "@/lib/conecta/meetings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_ROLES = new Set(["superadmin", "direccion", "gerencia", "cultura_conecta"]);

type MeetingEventPayload = {
  address?: string;
  audience?: string;
  date?: string;
  endTime?: string;
  equipmentCost?: number;
  expectedGuests?: number;
  foodPlan?: string;
  locationUrl?: string;
  meetingName?: string;
  modality?: string;
  notes?: string;
  otherCost?: number;
  owner?: string;
  phone?: string;
  quorumPercent?: number;
  startTime?: string;
  topics?: string;
  venueCost?: number;
};

async function getAuthenticatedProfile(request: Request) {
  const supabase = await createSupabaseServerClient();
  const db = supabase as any;
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : undefined;
  const authResult = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();
  const user = authResult.data.user;

  if (!user) {
    return { error: NextResponse.json({ ok: false, error: "No autorizado: inicia sesion para gestionar convocatorias." }, { status: 401 }) };
  }

  const { data: profile, error } = await db
    .from("user_profiles")
    .select("id, company_id, full_name, access_role, is_active")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !profile) {
    return { error: NextResponse.json({ ok: false, error: "No encontramos un perfil activo para este usuario." }, { status: 403 }) };
  }

  if (!ALLOWED_ROLES.has(profile.access_role)) {
    return { error: NextResponse.json({ ok: false, error: "Tu rol puede responder convocatorias, pero no crearlas." }, { status: 403 }) };
  }

  return { profile, supabase: db };
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedProfile(request);
  if (auth.error) return auth.error;

  const supabase = auth.supabase!;
  const profile = auth.profile!;

  const { data: events, error } = await supabase
    .from("meeting_events")
    .select("id, name, event_date, start_time, end_time, owner_label, audience_label, modality, expected_guests, quorum_percent, status, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const eventIds = (events || []).map((event: any) => event.id);
  const { data: responses } = eventIds.length
    ? await supabase
        .from("meeting_responses")
        .select("id, meeting_event_id, full_name, role_label, answer, requirements, created_at")
        .in("meeting_event_id", eventIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const countsByEvent = new Map<string, Record<string, number>>();
  for (const response of responses || []) {
    const counts = countsByEvent.get(response.meeting_event_id) || { confirmada: 0, pendiente: 0, rechazada: 0, virtual: 0 };
    counts[response.answer] = (counts[response.answer] || 0) + 1;
    countsByEvent.set(response.meeting_event_id, counts);
  }

  return NextResponse.json({
    ok: true,
    events: (events || []).map((event: any) => ({ ...event, counts: countsByEvent.get(event.id) || { confirmada: 0, pendiente: 0, rechazada: 0, virtual: 0 } })),
    responses: responses || [],
  });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedProfile(request);
  if (auth.error) return auth.error;

  const supabase = auth.supabase!;
  const profile = auth.profile!;
  const payload = (await request.json()) as MeetingEventPayload;

  if (!payload.meetingName?.trim() || !payload.date || !payload.startTime) {
    return NextResponse.json({ ok: false, error: "Nombre, fecha y hora de inicio son obligatorios." }, { status: 400 });
  }

  const token = createMeetingToken();
  const tokenHash = hashMeetingToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data: event, error } = await supabase
    .from("meeting_events")
    .insert({
      address: payload.address?.trim() || null,
      audience_label: payload.audience?.trim() || "Equipo convocado",
      company_id: profile.company_id,
      created_by_profile_id: profile.id,
      end_time: payload.endTime || null,
      equipment_cost: Number(payload.equipmentCost || 0),
      event_date: payload.date,
      expected_guests: Number(payload.expectedGuests || 0),
      expires_at: expiresAt.toISOString(),
      food_plan: payload.foodPlan || "refrigerio",
      location_url: payload.locationUrl?.trim() || null,
      logistics_notes: payload.notes?.trim() || null,
      modality: payload.modality || "presencial",
      name: payload.meetingName.trim(),
      other_cost: Number(payload.otherCost || 0),
      owner_label: payload.owner?.trim() || profile.full_name || "Gerencia convocante",
      phone: payload.phone?.trim() || null,
      public_note: "Confirma tu asistencia y deja observaciones si necesitas conexion virtual, soporte logistico o informacion adicional.",
      quorum_percent: Number(payload.quorumPercent || 70),
      start_time: payload.startTime,
      status: "open",
      token_hash: tokenHash,
      topics: parseTopics(payload.topics),
      venue_cost: Number(payload.venueCost || 0),
    })
    .select("id, name, event_date, start_time, end_time, owner_label, audience_label, modality, expected_guests, quorum_percent, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event, token });
}


