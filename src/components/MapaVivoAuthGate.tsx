"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasSupabasePublicConfig } from "@/lib/conecta/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AccessRole, AssignmentKind } from "@/lib/supabase/database.types";
import { OrgExperience, type AuthenticatedProfile, type OperationalAssignment } from "./OrgExperience";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  access_role: AccessRole;
  position_id: string | null;
};

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

async function mapProfilePositionToExternalKey(profile: ProfileRow) {
  if (!profile.position_id) {
    return profile;
  }

  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("positions")
    .select("external_key")
    .eq("id", profile.position_id)
    .single();

  return {
    ...profile,
    position_id: data?.external_key ?? profile.position_id,
  };
}

async function loadOperationalAssignments(profileId: string): Promise<OperationalAssignment[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_position_assignments")
    .select("id, position_id, operational_front_id, assignment_kind, label, report_frequency, is_primary")
    .eq("user_profile_id", profileId)
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    if (error) {
      console.warn("No se pudieron cargar los frentes operativos del perfil.", error);
    }

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

  if (positionsResponse.error) {
    console.warn("No se pudieron leer los cargos conectados al perfil.", positionsResponse.error);
  }

  if (frontsResponse.error) {
    console.warn("No se pudieron leer los frentes conectados al perfil.", frontsResponse.error);
  }

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

export function MapaVivoAuthGate({ serverProfile = null }: { serverProfile?: AuthenticatedProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthenticatedProfile>(serverProfile);
  const [isCheckingSession, setIsCheckingSession] = useState(!serverProfile);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function validateClientSession() {
      if (serverProfile) {
        const assignments = await loadOperationalAssignments(serverProfile.id);

        if (!isMounted) {
          return;
        }

        setProfile({ ...serverProfile, assignments });
        setIsCheckingSession(false);
        return;
      }

      if (!hasSupabasePublicConfig()) {
        setIsCheckingSession(false);
        setSessionError("Faltan las llaves publicas de Supabase para validar el acceso.");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !user) {
        router.replace("/acceso");
        return;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, access_role, position_id")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!isMounted) {
        return;
      }

      if (error || !data) {
        setSessionError("El usuario fue validado, pero no tiene un perfil activo en Plataforma Conecta.");
        setIsCheckingSession(false);
        return;
      }

      const profileRow = data as ProfileRow;
      const [profileWithExternalKey, assignments] = await Promise.all([
        mapProfilePositionToExternalKey(profileRow),
        loadOperationalAssignments(profileRow.id),
      ]);

      setProfile({ ...profileWithExternalKey, assignments });
      setIsCheckingSession(false);
    }

    validateClientSession();

    return () => {
      isMounted = false;
    };
  }, [router, serverProfile]);

  if (isCheckingSession) {
    return (
      <main className="mapa-auth-state">
        <div className="mapa-auth-state__card">
          <span>Plataforma Conecta</span>
          <h1>Verificando acceso...</h1>
          <p>Estamos confirmando tu sesion, rol y empresa antes de abrir el Mapa Vivo.</p>
        </div>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="mapa-auth-state">
        <div className="mapa-auth-state__card mapa-auth-state__card--error">
          <span>Acceso detenido</span>
          <h1>No pudimos abrir el Mapa Vivo</h1>
          <p>{sessionError}</p>
          <button onClick={() => router.replace("/acceso")} type="button">
            Volver al acceso
          </button>
        </div>
      </main>
    );
  }

  return <OrgExperience authenticatedProfile={profile} />;
}
