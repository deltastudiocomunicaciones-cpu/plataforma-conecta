import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const response = NextResponse.redirect(new URL("/mapa-vivo", request.url));
  response.headers.set("Cache-Control", "no-store");

  if (!code) {
    return NextResponse.redirect(new URL("/acceso?error=autenticacion", request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.redirect(new URL("/acceso?error=autenticacion", request.url));
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
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
    return NextResponse.redirect(new URL("/acceso?error=autenticacion", request.url));
  }

  const { data: identity, error: identityError } = await supabase.auth.getUser();
  if (identityError || !identity.user) {
    await supabase.auth.signOut();
    response.headers.set("location", new URL("/acceso?error=autenticacion", request.url).toString());
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
    response.headers.set("location", new URL("/acceso?error=acceso-no-autorizado", request.url).toString());
    return response;
  }

  return response;
}
