import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { MinuteDraft } from "@/lib/conecta/memory-demo-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

// This client uses the browser's Supabase SSR session for auth, RLS reads, and RPC.
// Do not replace it with the service-role client or accept profile/company IDs from UI input.
type LooseClient = SupabaseClient<Database>;
export type InstitutionalMinute = {
  id: string;
  code: string;
  title: string;
  status: string;
  version: number;
  payload: unknown;
  meetingEventId: string | null;
  createdByProfileId: string;
  createdAt: string;
  updatedAt: string;
};
export type InstitutionalHistory = { versions: Record<string, unknown>[]; events: Record<string, unknown>[] };
export type InstitutionalMeeting = {
  id: string;
  name: string;
  eventDate: string;
  status: string;
};

export async function listInstitutionalMeetings(): Promise<InstitutionalMeeting[]> {
  const { supabase, profile } = await authenticatedClient();
  // Database RLS remains authoritative; explicit company restriction is defense in depth.
  const { data, error } = await supabase.from("meeting_events")
    .select("id, name, event_date, status")
    .eq("company_id", profile.company_id)
    .order("event_date", { ascending: false })
    .limit(100);
  fail(error, "No se pudieron consultar las convocatorias autorizadas.");
  return (data ?? []).map((event) => ({
    id: event.id,
    name: event.name,
    eventDate: event.event_date,
    status: event.status,
  }));
}

function client(): LooseClient {
  return createSupabaseBrowserClient();
}

function fail(error: { message?: string } | null, fallback: string): never | void {
  if (error) throw new Error(error.message || fallback);
}

async function authenticatedClient() {
  const supabase = client();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  fail(authError, "No se pudo verificar la sesión de Supabase.");
  if (!user) throw new Error("Inicia sesión para consultar o guardar actas institucionales.");
  const { data: profile, error: profileError } = await supabase.from("user_profiles")
    .select("id, auth_user_id, company_id, access_role, is_active")
    .eq("auth_user_id", user.id).eq("is_active", true).maybeSingle();
  fail(profileError, "No se pudo verificar el perfil institucional activo.");
  if (!profile || profile.auth_user_id !== user.id) throw new Error("No hay un perfil institucional activo asociado a esta sesión.");
  return { supabase, profile };
}

function mapMinute(row: Record<string, unknown>): InstitutionalMinute {
  const payload = row.payload ?? row.content ?? row.document ?? {};
  const version = Number(row.version ?? row.current_version ?? row.version_number ?? 0);
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? row.document_code ?? row.minute_code ?? ""),
    title: String(row.title ?? "Acta institucional"),
    status: String(row.status ?? "borrador"),
    version: Number.isFinite(version) ? version : 0,
    payload,
    meetingEventId: typeof row.meeting_event_id === "string" ? row.meeting_event_id : null,
    createdByProfileId: String(row.created_by_profile_id ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

async function currentVersion(supabase: LooseClient, id: string): Promise<number> {
  const { data, error } = await supabase.from("institutional_minute_versions")
    .select("version_number").eq("minute_id", id).order("version_number", { ascending: false }).limit(1).maybeSingle();
  fail(error, "No se pudo determinar la versión actual del acta.");
  const version = Number(data?.version_number ?? 0);
  if (!Number.isInteger(version) || version < 1) throw new Error("El acta no tiene una versión documental válida.");
  return version;
}

function objectRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  return [];
}

export async function listInstitutionalMinutes(): Promise<InstitutionalMinute[]> {
  const { supabase } = await authenticatedClient();
  const { data, error } = await supabase.from("institutional_minutes").select("*").eq("status", "borrador").order("created_at", { ascending: false });
  fail(error, "No se pudieron recuperar las actas autorizadas.");
  const rows = (data ?? []) as Record<string, unknown>[];
  if (!rows.length) return [];
  const ids = rows.map((row) => String(row.id ?? "")).filter(Boolean);
  const { data: versions, error: versionError } = await supabase.from("institutional_minute_versions")
    .select("minute_id, version_number").in("minute_id", ids).order("version_number", { ascending: false });
  fail(versionError, "No se pudieron recuperar las versiones de las actas.");
  const latest = new Map<string, number>();
  for (const version of versions ?? []) {
    const minuteId = String(version.minute_id);
    if (!latest.has(minuteId)) latest.set(minuteId, Number(version.version_number));
  }
  return rows.map((row) => ({ ...mapMinute(row), version: latest.get(String(row.id)) ?? 0 }));
}

export async function getInstitutionalMinute(id: string): Promise<InstitutionalMinute> {
  const { supabase } = await authenticatedClient();
  const { data, error } = await supabase.from("institutional_minutes").select("*").eq("id", id).maybeSingle();
  fail(error, "No se pudo recuperar el acta autorizada.");
  if (!data) throw new Error("El acta no existe o tu sesión no tiene permiso para consultarla.");
  const minute = mapMinute(data as Record<string, unknown>);
  if (minute.status !== "borrador") throw new Error("Solo se puede continuar la edición de documentos en estado borrador.");
  return { ...minute, version: await currentVersion(supabase, id) };
}

export async function getInstitutionalHistory(id: string): Promise<InstitutionalHistory> {
  const { supabase } = await authenticatedClient();
  const [versions, events] = await Promise.all([
    supabase.from("institutional_minute_versions").select("*").eq("minute_id", id).order("version_number", { ascending: false }),
    supabase.from("institutional_minute_events").select("*").eq("minute_id", id).order("created_at", { ascending: false }),
  ]);
  fail(versions.error, "No se pudo recuperar el historial de versiones.");
  fail(events.error, "No se pudo recuperar la auditoría del acta.");
  return { versions: (versions.data ?? []) as Record<string, unknown>[], events: (events.data ?? []) as Record<string, unknown>[] };
}

export async function saveInstitutionalMinute(input: { id?: string; expectedVersion?: number | null; meetingEventId?: string | null; draft: MinuteDraft }): Promise<InstitutionalMinute> {
  if (input.draft.linked) throw new Error("Esta acta sigue vinculada a una convocatoria DEMO. Desvincúlala antes de crear un registro institucional.");
  if (input.draft.participants.length) throw new Error("El directorio de participantes disponible contiene identidades DEMO. Retira esas selecciones antes de guardar un acta institucional; no se modificó el contenido del formulario.");
  const { supabase, profile } = await authenticatedClient();
  const creationRoles = new Set(["superadmin", "direccion", "gerencia", "cultura_conecta"]);
  const managementRoles = new Set(["superadmin", "direccion"]);
  let storedMeetingEventId: string | null = null;
  if (!input.id && !creationRoles.has(profile.access_role)) throw new Error("Tu rol no está autorizado para crear actas institucionales.");
  if (input.id) {
    const { data: current, error: currentError } = await supabase.from("institutional_minutes")
      .select("created_by_profile_id, meeting_event_id").eq("id", input.id).maybeSingle();
    fail(currentError, "No se pudo verificar el permiso de edición del acta.");
    if (!current) throw new Error("El acta no existe o tu sesión no tiene permiso para editarla.");
    if (current.created_by_profile_id !== profile.id && !managementRoles.has(profile.access_role)) throw new Error("Solo la persona autora o Dirección/Superadministración puede editar esta acta.");
    storedMeetingEventId = current.meeting_event_id;
  }
  const title = input.draft.subject.trim();
  if (!title) throw new Error("Escribe el nombre o asunto antes de guardar.");
  if (Array.from(title).length > 300) throw new Error("El título supera el límite de 300 caracteres.");
  const requestedAt = Date.now();
  const payload = { ...input.draft, authorId: "" } as unknown as Record<string, unknown>;
  if (new TextEncoder().encode(JSON.stringify(payload)).byteLength > 1_048_576) throw new Error("El contenido del acta supera el máximo permitido de 1 MiB.");
  const { data, error } = await supabase.rpc("save_institutional_minute", {
    p_minute_id: input.id ?? null,
    p_title: title,
    // authorId in the legacy draft is presentation data; authorship is derived by SQL.
    p_content: payload as unknown as Json,
    // Undefined preserves the existing link; null explicitly unlinks it.
    p_meeting_event_id: input.meetingEventId === undefined ? storedMeetingEventId : input.meetingEventId,
    p_expected_version: input.id ? input.expectedVersion ?? null : null,
  });
  const row = objectRows(data)[0];
  let saved = row ? mapMinute(row) : null;
  const expectedVersion = input.expectedVersion ?? 0;
  const hasConfirmation = (value: InstitutionalMinute | null): value is InstitutionalMinute => !!value?.id && !!value.code && value.version > expectedVersion && row?.saved === true;
  if (error || !hasConfirmation(saved)) {
    // An RPC/network error can happen after the transaction committed. Reconcile with
    // the same authenticated, RLS-scoped client before reporting failure or allowing retry.
    let visible: InstitutionalMinute[];
    try { visible = await listInstitutionalMinutes(); }
    catch { throw new Error("Resultado de guardado incierto: no se pudo reconciliar con el archivo. Actualiza el archivo antes de volver a intentar."); }
    const canonical = (value: unknown): string => {
      if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
      if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
      return JSON.stringify(value);
    };
    const matches = visible.filter((minute) => {
      if (input.id) return minute.id === input.id && minute.version > expectedVersion && canonical(minute.payload) === canonical(payload);
      const created = Date.parse(minute.createdAt);
      return minute.title === title && created >= requestedAt - 5000 && canonical(minute.payload) === canonical(payload);
    });
    if (matches.length === 1) saved = matches[0];
    else if (error && input.id && visible.some((minute) => minute.id === input.id && minute.version !== expectedVersion)) {
      throw new Error("Conflicto de versión: el acta cambió en otra sesión. No se sobrescribió; actualiza el archivo y vuelve a abrir la versión vigente.");
    } else if (error) throw new Error(`No se confirmó el guardado (${error.message}). Se consultó el archivo con la sesión actual; si el documento no aparece, vuelve a cargar el archivo antes de reintentar.`);
    else throw new Error("La función respondió, pero el archivo no permitió confirmar código, UUID y versión. Actualiza el archivo antes de volver a intentar.");
  }
  if (!saved?.id || !saved.code || saved.version <= expectedVersion) throw new Error("La función no devolvió UUID, código y versión positiva confirmados.");
  if (saved.status !== "borrador") throw new Error("La función devolvió un estado distinto de borrador; el documento no se presenta como acta institucional editable.");
  return saved;
}

export function draftFromInstitutionalMinute(minute: InstitutionalMinute): MinuteDraft | null {
  if (!minute.payload || typeof minute.payload !== "object" || Array.isArray(minute.payload)) return null;
  return minute.payload as MinuteDraft;
}
