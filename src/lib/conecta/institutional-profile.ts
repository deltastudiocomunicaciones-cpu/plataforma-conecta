import source from "@/data/sdx-institutional-source.json";
import gpySource from "@/data/gpy-institutional-source.json";
import { getFunctionalProfile, type FunctionalProfile } from "./functional-profile";

export const NIVELAR_EVIDENCE_DOCTRINE = "La evidencia digital es un insumo de contexto y trazabilidad. No constituye, por sí sola, una calificación de productividad, desempeño o cumplimiento del funcionario.";
export const NORMATIVE_NOTE = "Esta referencia indica que la arquitectura del cargo utiliza principios y temas de gestión compatibles con ISO 9001:2026. No constituye por sí sola una certificación ISO ni sustituye la evaluación del Sistema de Gestión de Calidad de la organización.";
export type GateStatus = "NOT_EVALUATED" | "IN_PROGRESS" | "APPROVED" | "NOT_APPROVED";
export type SourceBlock = { kind: string; text?: string; rows?: string[][] };
export type Dimension = { code: string; title: string; blocks: SourceBlock[] };
export type Evidence = { id: string; source: string; reference: string; processCode: string | null; responsibilityCode: string | null; deliverableCode: string | null; recordedAt: string | null };
export type Indicator = { code: string; name: string; formula: string | null; interpretation: string | null; source: string | null; frequency: string | null; responsible: string | null; baseline: number | null; target: number | null; status: "pendingDefinition" | "defined"; documentaryState?: "EXISTENTE" | "PROPUESTO" | "PENDIENTE" };
export type Process = { code: string; name: string; input: string | null; output: string | null; responsibilities: FunctionalProfile["modules"][number]["responsibilities"] | null; deliverables: string[] | null; evidence: Evidence[] | null; indicators: string[] | null; risks: string[] | null; controls: string[] | null };
export type InstitutionalProfile = {
  documentarySource?: { source: string; sha256: string; preamble: SourceBlock[]; sections: Dimension[]; comparisons?: { source: string; sha256: string; section: string; rows: string[][]; conflicts: string[] }[]; conflicts: string[] };
  evidenceContract?: { field: string; function: string | null; origin: string | null }[];
  traceability?: { responsibility: string; function: string; result: string; deliverable: string; indicator: string; escalation: string; evidence: string | null; risk: string | null; control: string | null; state: "PROPUESTO" }[];
  designRisks?: { code: string; risk: string; proposedTreatment: string; cause: string | null; impact: string | null; control: string | null; responsible: string | null; evidence: Evidence[] | null; status: "pendingDefinition"; alert: string | null; escalation: string | null }[];
  institutionalContext?: {
    functionalLevel: string; systemicRole: string; area: string; superiorResult: string;
    separation: string[]; relatedProcesses: { code: string; name: string }[];
    macroResponsibilities: { code: string; description: string; result?: string }[];
    fieldStates: { field: keyof InstitutionalProfile; state: "EXISTENTE" | "PROPUESTO" | "PENDIENTE"; note: string }[];
  };
  schemaVersion: "2.0"; code: string | null; name: string; source: string;
  person: { positionId: string; name: string | null } | null;
  dependency: string | null; nature: string | null; purpose: string;
  managementFramework: string | null; normativeReference: string | null;
  documentVersion: string | null; documentStatus: string | null; reviewStatus: "pendingDefinition" | "pendingReview";
  dimensions: Dimension[] | null; preamble: SourceBlock[] | null; processes: Process[];
  lifecycle: string[] | null;
  responsibilities: { classification: string | null; description: string }[];
  boundaries: string[] | null; authority: string[] | null;
  deliverables: { family: string; deliverable: string; requiredEvidence: string | null; documentaryState?: "EXISTENTE" | "PROPUESTO" | "PENDIENTE" }[] | null;
  indicators: Indicator[]; evidence: Evidence[] | null;
  risks: { code: string | null; risk: string; control: string | null; evidence: Evidence[] | null; responsible: string | null; status: string | null; alert: string | null }[];
  raci: { activity: string; responsible: string[]; accountable: string[]; consulted: string[]; informed: string[]; notes: string | null; assignments: { role: string; designation: string }[] }[] | null;
  competencies: { name: string; behavior: string | null }[] | null;
  gate: { status: GateStatus; criteria: { code: string; criterion: string; status: GateStatus; evidence: Evidence[] | null; responsible: string | null }[] } | null;
  governance: { frequency: string; review: string; objective: string }[] | null;
  alerts: string[] | null; evaluation: string | null; improvement: string | null;
  support: { layer: string; function: string }[] | null;
  doctrines: { principle: string; rule: string }[] | null;
  approval: { role: string; name: string | null; decision: string | null; date: string | null }[] | null;
  fieldMapping: { field: string; category: "A" | "B" | "C"; origin: string | null }[];
};
const dimensions: Dimension[] = source.dimensions;
function section(code: string) { return dimensions.find(item => item.code === code)!; }
function table(code: string) { return section(code).blocks.find(block => block.kind === "table")!.rows!; }
function rows(code: string) { return table(code).slice(1); }
function paragraphs(code: string) { return section(code).blocks.filter(block => block.kind === "paragraph").map(block => block.text!); }
const raciHeaders = table("09")[0].slice(1);
export const cargoCero: InstitutionalProfile = {
  schemaVersion: "2.0", code: "SDX-001", name: "Subdirección de Desarrollo y Expansión", source: source.source,
  person: null, dependency: "Dirección General", nature: "Estratégica - transversal", purpose: paragraphs("01")[1],
  managementFramework: "Gestión por procesos", normativeReference: "ISO 9001:2026",
  documentVersion: "1.0", documentStatus: "Propuesta para revisión y aprobación institucional", reviewStatus: "pendingReview",
  dimensions, preamble: source.preamble,
  processes: rows("02").map(([code, name, input, output]) => ({ code, name, input, output, responsibilities: null, deliverables: null, evidence: null, indicators: null, risks: null, controls: null })),
  lifecycle: paragraphs("02").find(text => text.includes("→"))!.split("→").map(text => text.trim()),
  responsibilities: rows("03").map(([classification, description]) => ({ classification, description })),
  boundaries: paragraphs("03"), authority: rows("04").map(row => row.join(" · ")),
  deliverables: rows("05").map(([family, deliverable, requiredEvidence]) => ({ family, deliverable, requiredEvidence })),
  indicators: rows("06").map(([code, name, formula, interpretation]) => ({ code, name, formula, interpretation, source: null, frequency: null, responsible: null, baseline: null, target: null, status: "pendingDefinition" })),
  evidence: null,
  risks: rows("07").map(([code, risk, control]) => ({ code, risk, control, evidence: null, responsible: null, status: null, alert: null })),
  competencies: rows("08").map(([name, behavior]) => ({ name, behavior })),
  raci: rows("09").map(([activity, ...cells]) => {
    const assignments = cells.map((designation, i) => ({ role: raciHeaders[i], designation }));
    const roles = (letter: string) => assignments.filter(item => item.designation.replace("*", "").split("/").includes(letter)).map(item => item.role);
    return { activity, responsible: roles("R"), accountable: roles("A"), consulted: roles("C"), informed: roles("I"), assignments, notes: paragraphs("09").join("\n") || null };
  }),
  gate: { status: "NOT_EVALUATED", criteria: paragraphs("10").filter(text => text.startsWith("☐")).map((criterion, i) => ({ code: `GTO-${i + 1}`, criterion: criterion.replace(/^☐\s*/, ""), status: "NOT_EVALUATED", evidence: null, responsible: null })) },
  governance: rows("11").map(([frequency, review, objective]) => ({ frequency, review, objective })),
  improvement: paragraphs("11").slice(1).join("\n"),
  support: rows("12").map(([layer, functionText]) => ({ layer, function: functionText })),
  doctrines: rows("13").map(([principle, rule]) => ({ principle, rule })),
  approval: rows("14").map(([role, name, decision, date]) => ({ role, name: !name || name.includes("___") ? null : name, decision: decision || null, date: date || null })),
  alerts: null, evaluation: null,
  fieldMapping: ["person", "alerts", "evaluation", "processes.*.responsibilities", "processes.*.deliverables", "processes.*.evidence", "processes.*.indicators", "processes.*.risks", "processes.*.controls", "indicators.*.source", "indicators.*.frequency", "indicators.*.responsible", "indicators.*.baseline", "indicators.*.target", "evidence", "risks.*.evidence", "risks.*.responsible", "risks.*.status", "risks.*.alert", "gate.criteria.*.evidence", "gate.criteria.*.responsible", "approval.*.decision", "approval.*.date"].map(field => ({ field, category: "C", origin: null })),
};

export type ProfileRole = { id: string; title: string; positionLabel?: string; functionalProfile?: string; responsibleName?: string; purpose: string; responsibilities: string[]; authority: string[]; kpis?: string[]; risks?: string[]; profile?: string[] };
export function getInstitutionalProfile(role: ProfileRole): InstitutionalProfile | null {
  if (role.id === "subdirector-desarrollo-expansion") return { ...cargoCero, person: { positionId: role.id, name: role.responsibleName || null } };
  const functional = getFunctionalProfile(role.functionalProfile);
  if (!functional) return null;
  const mapped: InstitutionalProfile = { schemaVersion: "2.0", code: null, name: role.positionLabel || role.title, source: functional.source, person: { positionId: role.id, name: role.responsibleName || null }, dependency: null, nature: null, purpose: role.purpose, managementFramework: null, normativeReference: null, documentVersion: null, documentStatus: null, reviewStatus: "pendingDefinition", dimensions: null, preamble: null,
    processes: functional.modules.map(module => ({ code: module.code, name: module.name, input: null, output: null, responsibilities: module.responsibilities, deliverables: null, evidence: null, indicators: null, risks: null, controls: null })),
    responsibilities: role.responsibilities.map(description => ({ classification: null, description })), authority: role.authority,
    indicators: (role.kpis || []).map((name, i) => ({ code: `legacy-${i + 1}`, name, formula: null, interpretation: null, source: null, frequency: null, responsible: null, baseline: null, target: null, status: "pendingDefinition" as const })),
    risks: (role.risks || []).map(risk => ({ code: null, risk, control: null, evidence: null, responsible: null, status: null, alert: null })),
    competencies: role.profile?.map(name => ({ name, behavior: null })) || null,
    lifecycle: null, boundaries: null, deliverables: null, evidence: null, raci: null, gate: null, governance: null, alerts: null, evaluation: null, improvement: null, support: null, doctrines: null, approval: null,
    fieldMapping: [] as InstitutionalProfile["fieldMapping"],
  };
  mapped.fieldMapping = Object.keys(mapped).filter(field => !["fieldMapping", "schemaVersion"].includes(field)).map(field => ({ field, category: mapped[field as keyof typeof mapped] === null ? "C" : ["processes", "responsibilities", "indicators", "risks", "competencies"].includes(field) ? "B" : "A", origin: mapped[field as keyof typeof mapped] === null ? null : field === "processes" ? functional.source : "Ficha existente del cargo" }));
  mapped.fieldMapping.push(...["processes.*.input", "processes.*.output", "processes.*.deliverables", "processes.*.evidence", "processes.*.indicators", "processes.*.risks", "processes.*.controls", "responsibilities.*.classification", "indicators.*.formula", "indicators.*.source", "indicators.*.frequency", "indicators.*.responsible", "indicators.*.baseline", "indicators.*.target", "risks.*.control", "risks.*.responsible", "risks.*.evidence", "risks.*.status", "risks.*.alert", "competencies.*.behavior"].map(field => ({ field, category: "C" as const, origin: null })));
  if (role.id === "gerencia-09" && role.functionalProfile === "gerente-pymes") {
    const docSection = (code: string) => gpySource.sections.find(item => item.code === code)!;
    const docTables = (code: string) => docSection(code).blocks.filter(block => block.kind === "table").map(block => block.rows!);
    const docRows = (code: string, index = 0) => docTables(code)[index].slice(1);
    const docParagraphs = (code: string) => docSection(code).blocks.filter(block => block.kind === "paragraph").map(block => block.text!);
    mapped.code = "GPY-001";
    mapped.name = "Gerente PYMES";
    mapped.source = gpySource.source;
    mapped.dependency = "Dirección";
    mapped.documentVersion = "1.0";
    mapped.documentStatus = "Aprobación institucional pendiente";
    mapped.reviewStatus = "pendingReview";
    mapped.purpose = "Dirigir, gobernar, asegurar y mejorar el Macroproceso de Gestión Contable y Administrativa del área PYMES, garantizando que las organizaciones bajo su gestión sean atendidas conforme a los procesos, responsabilidades, controles y criterios institucionales definidos; orientando a los Contadores Auditores, gestionando capacidad y riesgos, evaluando resultados y promoviendo acciones de mejora que aseguren oportunidad, integridad, consistencia y calidad de la información.";
    mapped.boundaries = ["El Gerente PYMES gobierna el macroproceso; no debe absorber las revisiones operativas propias del Contador Auditor ni la ejecución propia del Analista Integrador."];
    mapped.institutionalContext = {
      functionalLevel: "Gerencial", systemicRole: "GOVERN", area: "PYMES",
      superiorResult: "Mantener el macroproceso PYMES bajo gobierno efectivo, de manera que las organizaciones asignadas sean atendidas de forma oportuna, controlada y trazable; las desviaciones y riesgos sean identificados, tratados o escalados; el equipo disponga de dirección y capacidad suficientes; y el sistema pueda mejorar sin depender de la intervención operativa permanente del Gerente.",
      separation: ["Dirección", "Gerente PYMES / GOVERN", "Contador Auditor / ASSURE", "Analista Integrador / EXECUTE"],
      relatedProcesses: ["Despliegue y parametrización contable", "Captura y procesamiento contable", "Aseguramiento y control contable", "Gestión tributaria", "Información financiera", "Gestión documental y archivo"].map((name, i) => ({ code: `MP0${i + 1}`, name })),
      macroResponsibilities: ["Planificar la operación", "Dirigir el equipo", "Asegurar el macroproceso", "Evaluar resultados", "Gestionar capacidad", "Gestionar riesgos", "Intervenir y escalar", "Mejorar el sistema"].map((description, i) => ({ code: `R0${i + 1}`, description })),
      fieldStates: [
        { field: "authority", state: "EXISTENTE", note: "Autoridad registrada conservada, sin atribuciones adicionales." },
        { field: "deliverables", state: "PROPUESTO", note: "Familias E01–E07 propuestas. Sus definiciones no fueron suministradas; no se materializan productos ni evidencia requerida." },
        { field: "evidence", state: "PENDIENTE", note: "Sin evidencias institucionales registradas. Los controles y resultados funcionales no equivalen a evidencia producida." },
        { field: "indicators", state: "PENDIENTE", note: "Indicadores descriptivos existentes, candidatos pendientes de ficha técnica: fórmula, interpretación, fuente, frecuencia, responsable, línea base y meta." },
        { field: "risks", state: "PENDIENTE", note: "Riesgos existentes; asociaciones riesgo-control pendientes de validación. Los controles originales permanecen en las subactividades." },
        { field: "raci", state: "PROPUESTO", note: "RACI propuesta para validación. Las asignaciones no fueron suministradas; no se infieren desde la jerarquía." },
        { field: "competencies", state: "PROPUESTO", note: "Requisitos existentes conservados. Competencias observables propuestas; conductas no suministradas." },
        { field: "governance", state: "PENDIENTE", note: "Cadencias pendientes; no se asignan frecuencias ni participantes." },
        { field: "evaluation", state: "PENDIENTE", note: "Método institucional pendiente. Evaluar resultados del macroproceso no equivale a calificar al funcionario." },
        { field: "improvement", state: "PENDIENTE", note: "Funciones de mejora preservadas en 1.7.1 y 1.7.2; formalización institucional pendiente." },
        { field: "approval", state: "PENDIENTE", note: "Aprobación institucional pendiente, sin decisiones, firmas ni fechas registradas." },
      ],
    };
    mapped.fieldMapping = mapped.fieldMapping.map(item => ["code", "name", "source", "dependency", "purpose", "documentVersion"].includes(item.field)
      ? { ...item, category: "A", origin: "C01-IMP-01 · contenido institucional suministrado" }
      : item.field === "boundaries" ? { ...item, category: "B", origin: "Criterio de separación funcional PYMES existente" }
      : ["reviewStatus", "documentStatus"].includes(item.field) ? { ...item, category: "C", origin: null } : item);
    mapped.fieldMapping.push({ field: "indicators.*.interpretation", category: "C", origin: null });
    mapped.documentarySource = { ...gpySource, conflicts: [
      "El código GPY-001, el nivel Gerencial y el rol GOVERN se preservan; el Word los identifica como propuestos, pendientes de aprobación.",
      "La matriz Word §15 no contiene asociaciones por fila a evidencia, riesgo o control. Permanecen null; no se deducen desde entregables o tareas.",
      "El contrato Word §8 agrupa campos de evidencia. Tipo, validador y fecha de validación no tienen definición individual en la fuente.",
      "El ciclo de ocho pasos procede de C01-IMP-04 §12; no aparece literalmente en el Word. Se conserva con esta procedencia expresa.",
      "La RACI del Word GPY §11 presenta tres conflictos de asignación y una diferencia de cobertura frente a Arquitectura PYMES §6. Ambas versiones se preservan; conciliación y aprobación pendientes.",
      "El Word sintetiza las tareas funcionales y abrevia el resultado de 1.2.1. Se conserva íntegro el catálogo funcional existente, sin sustituirlo por la síntesis.",
    ] };
    mapped.purpose = docParagraphs("2")[3];
    mapped.nature = docRows("1").find(row => row[0] === "Naturaleza")![1];
    mapped.deliverables = docRows("8").map(([family, deliverable, requiredEvidence]) => ({ family, deliverable, requiredEvidence, documentaryState: "PROPUESTO" }));
    const evidenceFields = docRows("8", 1);
    mapped.evidenceContract = ([
      ["Qué demuestra", 0], ["Responsabilidad / proceso relacionado", 1], ["Organización relacionada", 2],
      ["Tipo", null], ["Origen", 3], ["Productor", null], ["Fecha / período", 4],
      ["Referencia del artefacto", 5], ["Estado", 6], ["Validación", 6],
      ["Validador", null], ["Fecha de validación", null], ["Procedencia / trazabilidad", 7],
    ] as [string, number | null][]).map(([field, row]) => ({ field, function: row === null ? null : evidenceFields[row][1], origin: row === null ? null : `${gpySource.source} §8 · ${evidenceFields[row][0]}` }));
    mapped.indicators = mapped.indicators.map((indicator, i) => ({ ...indicator, code: `K0${i + 1}`, documentaryState: "EXISTENTE" }));
    mapped.indicators.push(...docRows("9", 1).map(([code, name, formula]) => ({ code, name, formula, interpretation: null, source: null, frequency: null, responsible: null, baseline: null, target: null, status: "pendingDefinition" as const, documentaryState: "PROPUESTO" as const })));
    mapped.designRisks = docRows("10").map(([code, risk, proposedTreatment]) => ({ code, risk, proposedTreatment, cause: null, impact: null, control: null, responsible: null, evidence: null, status: "pendingDefinition", alert: null, escalation: null }));
    const raciRoles = ["Dirección", "Gerente PYMES", "Contador Auditor", "Analista Integrador"];
    mapped.raci = docRows("11").map(([activity, ...cells]) => {
      const assignments = cells.map((designation, i) => ({ role: raciRoles[i], designation }));
      const roles = (letter: string) => assignments.filter(item => item.designation.split("/").map(part => part.trim()).includes(letter)).map(item => item.role);
      return { activity, assignments, responsible: roles("R"), accountable: roles("A"), consulted: roles("C"), informed: roles("I"), notes: "PROPUESTA PARA VALIDACIÓN. Designaciones condicionadas conservadas literalmente; no concede autoridad vigente." };
    });
    mapped.competencies = docRows("12").map(([name, behavior]) => ({ name, behavior }));
    mapped.governance = docRows("13").map(([review, objective, frequency]) => ({ frequency, review, objective }));
    mapped.evaluation = docParagraphs("13")[0];
    mapped.improvement = mapped.governance.find(item => item.review === "Mejora")!.objective;
    mapped.lifecycle = ["Planificar", "Ejecutar", "Asegurar", "Medir", "Analizar", "Intervenir", "Mejorar", "Replanificar"];
    mapped.traceability = docRows("15").map(([responsibility, functionText, result, deliverable, indicator, escalation]) => ({ responsibility, function: functionText, result, deliverable, indicator, escalation, evidence: null, risk: null, control: null, state: "PROPUESTO" }));
    mapped.doctrines = docParagraphs("17").map(text => { const [principle, ...rule] = text.split(". "); return { principle, rule: rule.join(". ") }; });
    mapped.approval = docRows("21").map(([role]) => ({ role, name: null, decision: null, date: null }));
    mapped.institutionalContext.superiorResult = docParagraphs("2")[5];
    mapped.institutionalContext.relatedProcesses = docRows("4").map(([code, name]) => ({ code, name }));
    mapped.institutionalContext.macroResponsibilities = docRows("6").map(([code, description, result]) => ({ code, description, result }));
    const revisedNotes: Partial<Record<keyof InstitutionalProfile, string>> = {
      deliverables: "E01–E07 PROPUESTOS PARA VALIDACIÓN. Evidencia mínima requerida documentada; no acredita producción, validación ni aceptación.",
      indicators: "K01–K05: nombres existentes con ficha técnica pendiente. G-K01–G-K07: fórmulas propuestas para validación; ningún indicador institucional activo.",
      raci: "PROPUESTA PARA VALIDACIÓN del Word §11; no concede autoridad vigente. Conciliación pendiente.",
      competencies: "Conductas observables PROPUESTAS PARA VALIDACIÓN del Word §12. Los requisitos funcionales existentes siguen disponibles en la ficha.",
      governance: "Arquitectura documentada; frecuencias PENDIENTES salvo Intervención y Escalamiento POR EVENTO, según Word §13.",
      evaluation: "Organización, Proceso, Cargo y Persona permanecen separados. Criterios y evaluación efectiva pendientes.",
      improvement: "Arquitectura documentada; no acredita mejoras realizadas ni evaluadas.",
    };
    mapped.institutionalContext.fieldStates = mapped.institutionalContext.fieldStates.map(item => ({ ...item, note: revisedNotes[item.field] || item.note }));
    mapped.institutionalContext.fieldStates.push({ field: "code", state: "PROPUESTO", note: "GPY-001: código institucional propuesto, pendiente de aprobación según Word §1." }, { field: "nature", state: "PROPUESTO", note: "Naturaleza, nivel Gerencial y rol GOVERN propuestos según Word §1; no equivalen a aprobación." });
    const documented = ["nature", "deliverables", "raci", "competencies", "competencies.*.behavior", "governance", "evaluation", "improvement", "lifecycle", "doctrines"];
    mapped.fieldMapping = mapped.fieldMapping.map(item => documented.includes(item.field) ? { ...item, category: "B", origin: `${gpySource.source} · documentado; aprobación pendiente` } : item);
    mapped.fieldMapping.push(...["code.approval", "deliverables.approval", "raci.approval", "competencies.approval", "governance.cadences", "traceability.*.evidence", "traceability.*.risk", "traceability.*.control", "evidenceContract.*.pendingDefinition", "indicators.proposals.approval", "authority.specificLimits", "conceptualStates.reconciliation", "approval.*.decision", "approval.*.date"].map(field => ({ field, category: "C" as const, origin: null })));
  }
  return mapped;
}
