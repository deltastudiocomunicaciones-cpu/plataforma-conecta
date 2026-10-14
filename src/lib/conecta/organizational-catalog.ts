/**
 * Safe presentation projection of the Mapa Vivo prototype for Memoria Viva.
 * This is a descriptive catalog, not a verified HR directory.
 */
export type OrganizationalCatalogNode = {
  id: string;
  title: string;
  level: string;
  reportsTo: string | null;
};

export type OrganizationalUnit = {
  id: string;
  name: string;
  category: "Gerencia" | "Área / gestión" | "Unidad operativa";
  parentId: string | null;
};

export const organizationalUnitCategories: readonly OrganizationalUnit["category"][] = [
  "Gerencia",
  "Área / gestión",
  "Unidad operativa",
];

const GOVERNANCE_NODE_IDS = new Set(["junta-socios", "junta-directiva"]);
const POSITION_NODE_IDS = new Set([
  "ceo",
  "subdirector-desarrollo-expansion",
  "subdirector-efectividad-operativa",
  "coordinacion-gestion-comercial",
]);

// These nodes represent external project relationships or territories, not
// internal units that can produce institutional records.
const EXTERNAL_RELATIONSHIP_NODE_IDS = new Set([
  "unidad-proyectos-kwel",
  "unidad-proyectos-lobos",
  "unidad-lobos-wolves-territory",
  "unidad-proyectos-aguacate",
  "unidad-proyectos-respirar-t-ips",
  "unidad-proyectos-madext",
]);

// These map labels contain personal names rather than organizational unit
// names. Exclude them so they are neither exposed nor mistaken for units.
const PERSONAL_NAME_LABEL_NODE_IDS = new Set([
  "unidad-pymes-01",
  "unidad-pymes-02",
  "unidad-pymes-04",
  "unidad-pymes-05",
  "unidad-pymes-06",
  "unidad-pymes-07",
]);

function classifyNode(node: OrganizationalCatalogNode): OrganizationalUnit["category"] | null {
  if (
    GOVERNANCE_NODE_IDS.has(node.id)
    || POSITION_NODE_IDS.has(node.id)
    || EXTERNAL_RELATIONSHIP_NODE_IDS.has(node.id)
    || PERSONAL_NAME_LABEL_NODE_IDS.has(node.id)
  ) {
    return null;
  }

  if (node.id.startsWith("gerencia-") || node.id === "direccion-operaciones") return "Gerencia";
  if (node.id.startsWith("gestion-")) return "Área / gestión";
  if (node.id.startsWith("unidad-")) return "Unidad operativa";

  // Unknown node kinds are intentionally omitted until classified explicitly.
  return null;
}

export function projectOrganizationalUnits(
  nodes: readonly OrganizationalCatalogNode[],
): OrganizationalUnit[] {
  return nodes.flatMap((node) => {
    const category = classifyNode(node);
    return category
      ? [{ id: node.id, name: node.title, category, parentId: node.reportsTo }]
      : [];
  });
}
