import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveAgentContext } from "@/lib/conecta/agent/context";
import { enrichInstitutionalContext } from "@/lib/conecta/agent/institutional-context";

export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const result = await resolveAgentContext(await createSupabaseServerClient());
    if (result.context) result.context = enrichInstitutionalContext(result.context);
    return NextResponse.json(result, {
      status: result.status === "unauthenticated" ? 401 : result.status === "forbidden" ? 403 : 200,
      headers,
    });
  } catch {
    return NextResponse.json({ status: "unavailable", context: null, message: "No se pudo consultar el contexto del cargo. Intenta nuevamente." }, { status: 503, headers });
  }
}
