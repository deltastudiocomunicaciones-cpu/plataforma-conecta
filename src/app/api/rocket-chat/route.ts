import { NextResponse } from "next/server";
import { sendRocketChatAlert, type RocketChatAlertDestination, type RocketChatAlertInput } from "@/lib/conecta/rocket-chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
  const hostname = new URL(request.url).hostname;
  const isLocalPrototype = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");

  const authResult = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  const user = authResult.data.user;

  if (!user && !(bearerToken && isLocalPrototype)) {
    return NextResponse.json(
      {
        ok: false,
        error: bearerToken
          ? "No autorizado: Supabase no valido el token de sesion."
          : "No autorizado: la alerta no recibio sesion activa.",
      },
      { status: 401 },
    );
  }

  try {
    const payload = (await request.json()) as RocketChatAlertInput & {
      destinations?: RocketChatAlertDestination[];
    };
    const destinations = Array.isArray(payload.destinations) && payload.destinations.length
      ? Array.from(new Set(payload.destinations))
      : [payload.target || "default"];
    const results = await Promise.all(
      destinations.map((target) => sendRocketChatAlert({ ...payload, target })),
    );

    return NextResponse.json({
      ok: results.every((result) => result.ok),
      delivered: results.some((result) => result.delivered),
      skipped: results.every((result) => result.skipped),
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar la alerta.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



