export type NivelarEmployee = {
  cedula: string;
  nombre_empleado: string;
  apellido_empleado: string;
  correo: string;
  grupo_empleado: string;
  cargo_empleado: string;
};

export type NivelarDailySummary = NivelarEmployee & {
  fecha: string;
  hora_inicio_calendario?: string;
  hora_fin_calendario?: string;
  hora_inicio_labores?: string;
  hora_fin_labores?: string;
  total_conexion?: string;
  productivo?: string;
  improductivo?: string;
  sin_clasificar?: string;
  neutral?: string;
  rango_cinco_diez?: string;
  rango_diez_quince?: string;
  rango_quince_treinta?: string;
  rango_treinta_cuarenta_cinco?: string;
  rango_cuarenta_cinco_sesenta?: string;
  rango_mayor_sesenta?: string;
  [key: string]: string | undefined;
};

const NIVELAR_BASE_URL = "https://nivelar.co/nivelar/web/index.php";
const STANDARD_SUMMARY_KEYS = new Set([
  "cedula",
  "nombre_empleado",
  "apellido_empleado",
  "correo",
  "grupo_empleado",
  "cargo_empleado",
  "fecha",
  "hora_inicio_calendario",
  "hora_fin_calendario",
  "hora_inicio_labores",
  "hora_fin_labores",
  "total_conexion",
  "productivo",
  "improductivo",
  "sin_clasificar",
  "neutral",
  "rango_cinco_diez",
  "rango_diez_quince",
  "rango_quince_treinta",
  "rango_treinta_cuarenta_cinco",
  "rango_cuarenta_cinco_sesenta",
  "rango_mayor_sesenta",
]);

function buildNivelarUrl(params: Record<string, string>) {
  const url = new URL(process.env.NIVELAR_API_BASE_URL || NIVELAR_BASE_URL);
  url.searchParams.set("r", "api/web");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

async function fetchNivelar<T>(params: Record<string, string>): Promise<T> {
  const token = process.env.NIVELAR_API_TOKEN;

  if (!token) {
    throw new Error("Falta NIVELAR_API_TOKEN en variables de entorno.");
  }

  const url = buildNivelarUrl({ ...params, token });

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Nivelar respondió HTTP ${response.status}. Longitud=${text.length}.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
  const contentType =
    response.headers.get("content-type") ?? "unknown";

  throw new Error(
    `Nivelar devolvió HTTP ${response.status} con Content-Type ${contentType}, pero el cuerpo no es JSON válido.`,
  );
}
}

export function extractNivelarCategories(summary: NivelarDailySummary) {
  return Object.fromEntries(
    Object.entries(summary).filter(([key, value]) => !STANDARD_SUMMARY_KEYS.has(key) && Boolean(value)),
  );
}

export async function fetchNivelarEmployees() {
  return fetchNivelar<NivelarEmployee[]>({ tipo: "2", tipo_informe: "2" });
}

export async function fetchNivelarDailySummaries(dateFrom: string, dateTo: string, onlyWorkday = true) {
  return fetchNivelar<NivelarDailySummary[]>({
    tipo: "1",
    tipo_informe: onlyWorkday ? "2" : "1",
    fecha_inicio: dateFrom,
    fecha_fin: dateTo,
  });
}

export type NivelarDuration = {
  raw: string;
  seconds: number;
};

export function parseNivelarDuration(value: string | undefined): NivelarDuration | null {
  if (!value) {
    return null;
  }

  const match = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  return {
    raw: value,
    seconds: hours * 3600 + minutes * 60 + seconds,
  };
}

export type NivelarEvidenceV1 = {
  source: "nivelar";
  version: 1;
  date: string;

  schedule: {
    start: string | null;
    end: string | null;
  };

  observedWork: {
    start: string | null;
    end: string | null;
    totalConnection: NivelarDuration | null;
  };

  classification: {
    productive: NivelarDuration | null;
    unproductive: NivelarDuration | null;
    neutral: NivelarDuration | null;
    unclassified: NivelarDuration | null;
  };

  categories: Record<string, NivelarDuration>;
};

export function normalizeNivelarDailySummary(
  summary: NivelarDailySummary,
): NivelarEvidenceV1 {
  const rawCategories = extractNivelarCategories(summary);

  const categories = Object.fromEntries(
    Object.entries(rawCategories).flatMap(([key, value]) => {
      const duration = parseNivelarDuration(value);

      return duration ? [[key, duration]] : [];
    }),
  );

  return {
    source: "nivelar",
    version: 1,
    date: summary.fecha,

    schedule: {
      start: summary.hora_inicio_calendario ?? null,
      end: summary.hora_fin_calendario ?? null,
    },

    observedWork: {
      start: summary.hora_inicio_labores ?? null,
      end: summary.hora_fin_labores ?? null,
      totalConnection: parseNivelarDuration(summary.total_conexion),
    },

    classification: {
      productive: parseNivelarDuration(summary.productivo),
      unproductive: parseNivelarDuration(summary.improductivo),
      neutral: parseNivelarDuration(summary.neutral),
      unclassified: parseNivelarDuration(summary.sin_clasificar),
    },

    categories,
  };
}