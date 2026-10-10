import { NextRequest, NextResponse } from "next/server";

import { canAccess } from "@/lib/conecta/access-policy";
import {
  fetchNivelarDailySummaries,
  normalizeNivelarDailySummary,
} from "@/lib/conecta/nivelar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getValueType(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

export async function GET(request: NextRequest) {
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
      throw new Error("NIVELAR_DAILY_PROFILE_READ_FAILED");
    }

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          status: "forbidden_profile",
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
      throw new Error("NIVELAR_DAILY_COMPANY_READ_FAILED");
    }

    if (!company) {
  return NextResponse.json(
    {
      ok: false,
      status: "forbidden_company",
    },
    {
      status: 403,
      headers: responseHeaders,
    },
  );
}

if (!canAccess(profile.access_role, "view:nivelar-evidence")) {
  return NextResponse.json(
    {
      ok: false,
      status: "forbidden_permission",
      accessRole: profile.access_role,
    },
    {
      status: 403,
      headers: responseHeaders,
    },
  );
}

    const date = request.nextUrl.searchParams.get("date");

    if (!date || !DATE_PATTERN.test(date)) {
      return NextResponse.json(
        {
          ok: false,
          status: "invalid_request",
          message: "Se requiere una fecha con formato YYYY-MM-DD.",
        },
        {
          status: 400,
          headers: responseHeaders,
        },
      );
    }

    const summaries = await fetchNivelarDailySummaries(date, date, true);

const firstSummary = summaries[0];

const normalizedEvidence = firstSummary
  ? normalizeNivelarDailySummary(firstSummary)
  : null;

const valueTypes = firstSummary
  ? Object.fromEntries(
      Object.entries(firstSummary)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => [key, getValueType(value)]),
    )
  : {};

  const semanticSample = firstSummary
  ? {
      fecha: firstSummary.fecha,
      hora_inicio_calendario: firstSummary.hora_inicio_calendario,
      hora_fin_calendario: firstSummary.hora_fin_calendario,
      hora_inicio_labores: firstSummary.hora_inicio_labores,
      hora_fin_labores: firstSummary.hora_fin_labores,
      total_conexion: firstSummary.total_conexion,
      productivo: firstSummary.productivo,
      improductivo: firstSummary.improductivo,
      neutral: firstSummary.neutral,
      sin_clasificar: firstSummary.sin_clasificar,
      rango_cinco_diez: firstSummary.rango_cinco_diez,
      rango_diez_quince: firstSummary.rango_diez_quince,
      rango_quince_treinta: firstSummary.rango_quince_treinta,
      rango_treinta_cuarenta_cinco:
        firstSummary.rango_treinta_cuarenta_cinco,
      rango_cuarenta_cinco_sesenta:
        firstSummary.rango_cuarenta_cinco_sesenta,
      rango_mayor_sesenta: firstSummary.rango_mayor_sesenta,
      portales: firstSummary.portales,
      redes: firstSummary.redes,
      series: firstSummary.series,
      viajes: firstSummary.viajes,
      banco_empleo: firstSummary.banco_empleo,
      arriendos: firstSummary.arriendos,
    }
  : null;

return NextResponse.json(
  {
    ok: true,
    provider: "nivelar",
    operation: "daily-summary-handshake",
    requestedDate: date,
    recordCount: summaries.length,
    contract: {
  isArray: Array.isArray(summaries),
  fields: firstSummary
    ? Object.keys(firstSummary).sort()
    : [],
  valueTypes,
},
semanticSample,
normalizedEvidence,
  },
  {
    status: 200,
    headers: responseHeaders,
  },
);
  } catch (error) {
    console.error(
      "NIVELAR_DAILY_PROBE_FAILED",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );

    return NextResponse.json(
      {
        ok: false,
        status: "unavailable",
        message: "No se pudo verificar el resumen diario de Nivelar.",
      },
      {
        status: 503,
        headers: responseHeaders,
      },
    );
  }
}