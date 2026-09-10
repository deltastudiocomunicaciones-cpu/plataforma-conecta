"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function MapExit({ authenticated }: { authenticated: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function exitMap() {
    setBusy(true);
    setError("");
    try {
      if (authenticated) {
        const { error } = await createSupabaseBrowserClient().auth.signOut({ scope: "local" });
        if (error) throw error;
      }
      window.location.replace("/acceso");
    } catch {
      setError("No se pudo cerrar la sesión. Intenta de nuevo.");
      setBusy(false);
    }
  }

  return <div className="map-exit">
    <button className="export-button" type="button" disabled={busy} onClick={exitMap}>
      <LogOut size={17} aria-hidden="true" />
      {busy ? "Saliendo…" : authenticated ? "Cerrar sesión y salir" : "Salir del mapa"}
    </button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
