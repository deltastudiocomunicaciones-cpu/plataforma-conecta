import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y la llave publica de Supabase.");
  }

  return createBrowserClient<Database>(supabaseUrl, supabasePublicKey);
}
