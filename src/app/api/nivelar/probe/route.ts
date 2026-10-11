import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "private, no-store" };

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

    // SEC-NIV-02: authentication and general role permissions do not authorize
    // a global employee query. Keep this endpoint closed until an approved
    // session/company/employee binding and provider scope exist.
    // No profile, employee, provider or caller-supplied identifier is read.
    return NextResponse.json(
      { ok: false, status: "forbidden" },
      { status: 403, headers: responseHeaders },
    );
  } catch {
    console.error("NIVELAR_PROBE_FAILED");
    return NextResponse.json(
      { ok: false, status: "unavailable" },
      { status: 503, headers: responseHeaders },
    );
  }
}
