import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// OAuth and email-recovery redirects must first exchange the one-time PKCE code.
// Never redirect to caller-supplied URLs: only these internal destinations are valid.
const DESTINATIONS = new Set(["/mapa-vivo", "/acceso?modo=nueva-clave"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next") ?? "/mapa-vivo";
  const destination = DESTINATIONS.has(requested) ? requested : "/mapa-vivo";

  if (!code) {
    return NextResponse.redirect(new URL("/acceso?error=invalid_link", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/acceso?error=invalid_link", origin));
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.redirect(new URL("/acceso?error=invalid_link", origin));
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/acceso?error=profile", origin));
  }

  return NextResponse.redirect(new URL(destination, origin));
}
