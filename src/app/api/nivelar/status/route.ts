import { NextResponse } from "next/server";

export async function GET() {
  const hasToken = Boolean(process.env.NIVELAR_API_TOKEN);
  const hasBaseUrl = Boolean(process.env.NIVELAR_API_BASE_URL);

  return NextResponse.json({
    ok: true,
    provider: "nivelar",
    mode: "backend-sync-prepared",
    configured: hasToken,
    baseUrlConfigured: hasBaseUrl,
    pilotScope: "pymes",
    message: hasToken
      ? "Conecta tiene token Nivelar configurado. La sincronización debe activarse con alcance Pymes aprobado."
      : "Conecta está preparado para Nivelar. Falta NIVELAR_API_TOKEN para activar la sincronización real.",
  });
}
