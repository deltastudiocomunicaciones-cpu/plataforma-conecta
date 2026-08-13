import { MapaVivoAuthGate } from "@/components/MapaVivoAuthGate";
import type { OperationalAssignment } from "@/components/OrgExperience";
import type { AssignmentKind } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AssignmentRow = {
  id: string;
  position_id: string;
  operational_front_id: string | null;
  assignment_kind: AssignmentKind;
  label: string | null;
  report_frequency: string;
  is_primary: boolean;
};

type PositionLookupRow = {
  id: string;
  external_key: string;
  title: string;
};

type OperationalFrontLookupRow = {
  id: string;
  external_key: string;
  name: string;
};

async function loadServerOperationalAssignments(
  supabase: SupabaseServerClient,
  profileId: string,
): Promise<OperationalAssignment[]> {
  const { data, error } = await supabase
    .from("user_position_assignments")
    .select("id, position_id, operational_front_id, assignment_kind, label, report_frequency, is_primary")
    .eq("user_profile_id", profileId)
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return [];
  }

  const assignments = data as unknown as AssignmentRow[];
  const positionIds = Array.from(new Set(assignments.map((assignment) => assignment.position_id).filter(Boolean)));
  const frontIds = Array.from(
    new Set(assignments.map((assignment) => assignment.operational_front_id).filter(Boolean)),
  ) as string[];

  const [positionsResponse, frontsResponse] = await Promise.all([
    positionIds.length
      ? supabase.from("positions").select("id, external_key, title").in("id", positionIds)
      : Promise.resolve({ data: [], error: null }),
    frontIds.length
      ? supabase.from("operational_fronts").select("id, external_key, name").in("id", frontIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const positions = (positionsResponse.data ?? []) as PositionLookupRow[];
  const fronts = (frontsResponse.data ?? []) as OperationalFrontLookupRow[];
  const positionById = new Map(positions.map((position) => [position.id, position]));
  const frontById = new Map(fronts.map((front) => [front.id, front]));

  return assignments.map((assignment) => {
    const position = positionById.get(assignment.position_id);
    const front = assignment.operational_front_id ? frontById.get(assignment.operational_front_id) : null;

    return {
      id: assignment.id,
      position_id: assignment.position_id,
      position_external_key: position?.external_key ?? null,
      position_title: position?.title ?? null,
      operational_front_id: assignment.operational_front_id,
      operational_front_key: front?.external_key ?? null,
      operational_front_name: front?.name ?? assignment.label ?? position?.title ?? "Frente de gestión",
      assignment_kind: assignment.assignment_kind,
      label: assignment.label,
      report_frequency: assignment.report_frequency,
      is_primary: assignment.is_primary,
    };
  });
}

export default async function MapaVivoPage() {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
  let authenticatedProfile = null;

  if (hasSupabaseConfig) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, access_role, position_id")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      if (profile) {
        const [positionResponse, assignments] = await Promise.all([
          profile.position_id
            ? supabase.from("positions").select("external_key").eq("id", profile.position_id).single()
            : Promise.resolve({ data: null, error: null }),
          loadServerOperationalAssignments(supabase, profile.id),
        ]);

        authenticatedProfile = {
          ...profile,
          position_id: positionResponse.data?.external_key ?? profile.position_id,
          assignments,
        };
      }
    }
  }

  return <MapaVivoAuthGate serverProfile={authenticatedProfile} />;
}
