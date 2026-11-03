import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// Only fixed internal destinations can follow an OAuth or recovery callback.
const DESTINATIONS = new Set(["/mapa-vivo", "/acceso?modo=nueva-clave"]);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/mapa-vivo";
  const destination = DESTINATIONS.has(next) ? next : "/mapa-vivo";
  const redirect = (path: string) => new URL(path, request.url);
  if (!code) return NextResponse.redirect(redirect("/acceso?error=invalid_link"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.redirect(redirect("/acceso?error=invalid_link"));

  // Attach refreshed auth cookies to the actual redirect response.
  const response = NextResponse.redirect(redirect(destination));
  response.headers.set("Cache-Control", "no-store");
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items) {
        items.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    response.headers.set("location", redirect("/acceso?error=invalid_link").toString());
    return response;
  }

  const { data: identity, error: identityError } = await supabase.auth.getUser();
  if (identityError || !identity.user) {
    await supabase.auth.signOut();
    response.headers.set("location", redirect("/acceso?error=invalid_link").toString());
    return response;
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", identity.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    response.headers.set("location", redirect("/acceso?error=profile").toString());
  }
  return response;
}
