import { NextResponse } from "next/server";

import { canAccess } from "@/lib/conecta/access-policy";
import { fetchNivelarEmployees } from "@/lib/conecta/nivelar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          status: "unauthenticated",
        },
        {
          status: 401,
          headers: responseHeaders,
        },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("access_role, company_id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (profileError) {
      throw new Error("NIVELAR_PROFILE_READ_FAILED");
    }

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          status: "forbidden",
        },
        {
          status: 403,
          headers: responseHeaders,
        },
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", profile.company_id)
      .eq("status", "active")
      .maybeSingle();

    if (companyError) {
      throw new Error("NIVELAR_COMPANY_READ_FAILED");
    }

    if (!company || !canAccess(profile.access_role, "view:sensitive-data")) {
      return NextResponse.json(
        {
          ok: false,
          status: "forbidden",
        },
        {
          status: 403,
          headers: responseHeaders,
        },
      );
    }

    const employees = await fetchNivelarEmployees();

    return NextResponse.json(
      {
        ok: true,
        provider: "nivelar",
        operation: "employees-handshake",
        employeeCount: employees.length,
        contract: {
          isArray: Array.isArray(employees),
          fields:
            employees.length > 0
              ? Object.keys(employees[0]).sort()
              : [],
        },
      },
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    console.error(
      "NIVELAR_PROBE_FAILED",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );

    return NextResponse.json(
      {
        ok: false,
        status: "unavailable",
        message: "No se pudo verificar la conexión con Nivelar.",
      },
      {
        status: 503,
        headers: responseHeaders,
      },
    );
  }
}