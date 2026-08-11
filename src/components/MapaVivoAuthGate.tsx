"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasSupabasePublicConfig } from "@/lib/conecta/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AccessRole } from "@/lib/supabase/database.types";
import { OrgExperience, type AuthenticatedProfile } from "./OrgExperience";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  access_role: AccessRole;
  position_id: string | null;
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

export function MapaVivoAuthGate({ serverProfile = null }: { serverProfile?: AuthenticatedProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthenticatedProfile>(serverProfile);
  const [isCheckingSession, setIsCheckingSession] = useState(!serverProfile);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (serverProfile) {
      return;
    }

    let isMounted = true;

    async function validateClientSession() {
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

      const profileWithExternalKey = await mapProfilePositionToExternalKey(data as ProfileRow);
      setProfile(profileWithExternalKey);
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
