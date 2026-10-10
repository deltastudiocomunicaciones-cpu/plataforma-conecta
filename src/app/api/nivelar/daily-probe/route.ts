import { NextResponse } from "next/server";

import { canAccess } from "@/lib/conecta/access-policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "private, no-store" };

function deny() {
  // Do not disclose roles, links, employee identifiers or provider metadata.
  return NextResponse.json(
    { ok: false, status: "forbidden" },
    { status: 403, headers: responseHeaders },
  );
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, status: "unauthenticated" },
        { status: 401, headers: responseHeaders },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("access_role, company_id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (profileError) throw new Error("PROFILE_READ_FAILED");
    if (!profile || typeof profile.company_id !== "string" || !profile.company_id.trim()) return deny();

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", profile.company_id)
      .eq("status", "active")
      .maybeSingle();

    if (companyError) throw new Error("COMPANY_READ_FAILED");
    if (!company || company.id !== profile.company_id) return deny();
    if (!canAccess(profile.access_role, "view:nivelar-evidence")) return deny();

    // SEC-NIV-01: even a future role grant must not bypass this closed gate.
    // The existing link's `active` status is not identity verification, and
    // the provider contract has no verified company/employee query scope.
    // Do not read links, stored summaries or the global provider until an
    // explicit resource policy and session/company/employee binding exist.
    // Client query parameters, headers and name matching cannot supply them.
    return deny();
  } catch {
    // Exception messages can contain credentials, URLs or upstream payloads.
    console.error("NIVELAR_DAILY_PROBE_FAILED");
    return NextResponse.json(
      { ok: false, status: "unavailable" },
      { status: 503, headers: responseHeaders },
    );
  }
}
