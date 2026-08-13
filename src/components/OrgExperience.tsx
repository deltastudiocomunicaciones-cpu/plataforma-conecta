"use client";

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleDot,
  Download,
  FileText,
  IdCard,
  Filter,
  Layers,
  Network,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  UserRound,
  Target,
  Upload,
  Users,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import orgData from "../data/grupo-ac-org.json";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RocketChatAlertInput } from "@/lib/conecta/rocket-chat";
import type { AccessRole, AssignmentKind } from "@/lib/supabase/database.types";

type ActivityItem = {
  name: string;
  subactivities: string[];
};

type OrgNode = {
  id: string;
  title: string;
  area: string;
  subtitle?: string;
  businessUnit: string;
  responsibleName?: string;
  identityDocument?: string;
  phone?: string;
  professionalProfile?: string;
  level: string;
  status: string;
  reportsTo: string | null;
  purpose: string;
  responsibilities: string[];
  activities: ActivityItem[];
  kpis: string[];
  authority: string[];
  processes: string[];
  documents: string[];
  profile: string[];
  risks: string[];
  tags: string[];
  photo?: string;
  coverPhoto?: string;
};

type TreeNode = OrgNode & {
  children: TreeNode[];
};

type WeeklyReport = {
  id: string;
  roleId: string;
  roleTitle: string;
  responsibleName: string;
  assignmentId?: string;
  operationalFrontId?: string;
  operationalFrontName?: string;
  week: string;
  status: "pendiente" | "entregado" | "observado" | "aprobado" | "vencido" | "ajuste" | "escalado";
  progress: string;
  completedTasks?: string;
  pendingTasks?: string;
  evidenceUrl: string;
  evidenceFiles?: string[];
  riskType?: string;
  priority?: "baja" | "media" | "alta" | "critica";
  urgency?: "baja" | "media" | "alta" | "critica";
  risks: string;
  decisions: string;
  decisionOwner?: string;
  approvalDeadline?: string;
  decisionDeadline?: string;
  nextActions: string;
  createdAt: string;
  reviewStatus?: "sin_revision" | "aprobado" | "observado" | "ajuste" | "escalado";
  reviewComment?: string;
  reviewedAt?: string;
};

const statusLabels: Record<string, string> = {
  actual: "Actual",
  propuesto: "Propuesto",
  vacante: "Vacante",
  tercerizado: "Tercerizado",
};

const reportStatusLabels: Record<WeeklyReport["status"], string> = {
  pendiente: "Pendiente de envío",
  entregado: "Enviado / recibido",
  observado: "Observado",
  aprobado: "Aprobado",
  vencido: "Vencido sin cierre",
  ajuste: "Ajuste solicitado",
  escalado: "Escalado a direccion",
};

const reviewActionLabels: Record<NonNullable<WeeklyReport["reviewStatus"]>, string> = {
  sin_revision: "Pendiente de revision",
  aprobado: "Aprobado y cerrado",
  observado: "Observado por revisar",
  ajuste: "Ajuste solicitado",
  escalado: "Escalado a direccion",
};

type AccessRoleId = AccessRole;

export type OperationalAssignment = {
  id: string;
  position_id: string;
  position_external_key: string | null;
  position_title: string | null;
  operational_front_id: string | null;
  operational_front_key: string | null;
  operational_front_name: string;
  assignment_kind: AssignmentKind;
  label: string | null;
  report_frequency: string;
  is_primary: boolean;
};

export type AuthenticatedProfile = {
  id: string;
  full_name: string;
  email: string;
  access_role: AccessRole;
  position_id: string | null;
  assignments?: OperationalAssignment[];
} | null;

const accessProfiles: Record<AccessRoleId, {
  label: string;
  scope: string;
  description: string;
  credential: string;
  entryPoint: string;
  securityNote: string;
  canViewDashboard: boolean;
  canCreatePulse: boolean;
  canReviewPulse: boolean;
  canViewSensitiveData: boolean;
}> = {
  superadmin: {
    label: "Superadministrador",
    scope: "Todo el sistema",
    description: "Configura estructura, accesos, informes, dashboard, estados y trazabilidad completa.",
    credential: "Correo corporativo + doble validacion",
    entryPoint: "Consola maestra",
    securityNote: "Gobierna usuarios, roles, empresas, auditoria y parametros del sistema.",
    canViewDashboard: true,
    canCreatePulse: true,
    canReviewPulse: true,
    canViewSensitiveData: true,
  },
  direccion: {
    label: "Direccion",
    scope: "Gobierno corporativo",
    description: "Consulta todos los informes de gestion, aprueba, observa, escala decisiones y revisa informacion sensible.",
    credential: "Documento o correo directivo",
    entryPoint: "Dashboard ejecutivo",
    securityNote: "Acceso total a lectura, revision y decisiones; cambios estructurales restringidos.",
    canViewDashboard: true,
    canCreatePulse: false,
    canReviewPulse: true,
    canViewSensitiveData: true,
  },
  gerencia: {
    label: "Gerencia",
    scope: "Area asignada",
    description: "Revisa los informes de gestion de su equipo, solicita ajustes y escala decisiones a direccion.",
    credential: "Correo corporativo del area",
    entryPoint: "Bandeja gerencial",
    securityNote: "Visualiza solo cargos, informes y evidencias bajo su alcance autorizado.",
    canViewDashboard: true,
    canCreatePulse: true,
    canReviewPulse: true,
    canViewSensitiveData: false,
  },
  responsable: {
    label: "Responsable de cargo",
    scope: "Cargo propio",
    description: "Registra su informe de gestion semanal, adjunta evidencia y consulta el estado de sus revisiones.",
    credential: "Documento o clave asignada",
    entryPoint: "Mi perfil Conecta",
    securityNote: "Registra informacion propia; no accede a datos sensibles ni informes de otros cargos.",
    canViewDashboard: false,
    canCreatePulse: true,
    canReviewPulse: false,
    canViewSensitiveData: false,
  },
  cultura_conecta: {
    label: "Cultura Conecta",
    scope: "Acompanamiento y metodo",
    description: "Administra el metodo, acompana la adopcion y audita el comportamiento del sistema.",
    credential: "Cuenta consultora autorizada",
    entryPoint: "Acompanamiento Conecta",
    securityNote: "Observa adopcion, calidad del sistema y riesgos de gestion sin reemplazar al gobierno interno.",
    canViewDashboard: true,
    canCreatePulse: true,
    canReviewPulse: true,
    canViewSensitiveData: true,
  },
  lector: {
    label: "Lector",
    scope: "Consulta protegida",
    description: "Consulta la informacion autorizada sin intervenir informes, decisiones ni configuraciones.",
    credential: "Correo invitado autorizado",
    entryPoint: "Vista de consulta",
    securityNote: "Acceso limitado a lectura del perfil asignado y datos no sensibles.",
    canViewDashboard: false,
    canCreatePulse: false,
    canReviewPulse: false,
    canViewSensitiveData: false,
  },
};

function buildTree(nodes: OrgNode[]) {
  const map = new Map<string, TreeNode>();
  nodes.forEach((node) => map.set(node.id, { ...node, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.reportsTo && map.has(node.reportsTo)) {
      map.get(node.reportsTo)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function getHierarchyScope(rootId: string, nodes: OrgNode[]) {
  const childrenByParent = new Map<string, string[]>();

  nodes.forEach((node) => {
    if (!node.reportsTo) return;
    const current = childrenByParent.get(node.reportsTo) ?? [];
    childrenByParent.set(node.reportsTo, [...current, node.id]);
  });

  const scopedIds = new Set<string>([rootId]);
  const stack = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;

    const children = childrenByParent.get(currentId) ?? [];
    children.forEach((childId) => {
      if (scopedIds.has(childId)) return;
      scopedIds.add(childId);
      stack.push(childId);
    });
  }

  return scopedIds;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section">
      <div className="detail-section__title">
        <Icon aria-hidden="true" size={17} />
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function OrgCard({
  node,
  selected,
  dimmed,
  onSelect,
}: {
  node: TreeNode | OrgNode;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const childrenCount = "children" in node ? node.children.length : 0;
  const isSimpleNode = node.level !== "Nivel 1" && node.level !== "Nivel 2";

  return (
    <button
      className={`org-card ${isSimpleNode ? "org-card--simple" : ""} ${
        selected ? "org-card--selected" : ""
      } ${dimmed ? "org-card--dimmed" : ""}`}
      data-node-id={node.id}
      onClick={() => onSelect(node.id)}
      type="button"
    >
      <span className={`status-dot status-dot--${node.status}`} />
<span className="org-card__content">
        <strong>{node.title}</strong>
        {!isSimpleNode && node.subtitle ? <small>{node.subtitle}</small> : null}
        {!isSimpleNode ? (
          <span className="org-card__meta">
            <Users aria-hidden="true" size={12} />
            {childrenCount} reportes
          </span>
        ) : null}
      </span>
    </button>
  );
}

function TreeBranch({
  node,
  selectedId,
  visibleIds,
  hasActiveFilter,
  supportNodes,
  onSelect,
}: {
  node: TreeNode;
  selectedId: string;
  visibleIds: Set<string>;
  hasActiveFilter: boolean;
  supportNodes: TreeNode[];
  onSelect: (id: string) => void;
}) {
  const dimmed = hasActiveFilter && !visibleIds.has(node.id);

  return (
    <li>
      <OrgCard
        dimmed={dimmed}
        node={node}
        onSelect={onSelect}
        selected={selectedId === node.id}
      />
      {node.id === "ceo" && supportNodes.length > 0 ? (
        <div className="direction-support-row" aria-label="Cargos de apoyo a Direccion">
          <div className="support-cards">
            {supportNodes.map((supportNode) => (
              <div className="support-branch" key={supportNode.id}>
                <OrgCard
                  dimmed={hasActiveFilter && !visibleIds.has(supportNode.id)}
                  node={supportNode}
                  onSelect={onSelect}
                  selected={selectedId === supportNode.id}
                />
                {supportNode.children.length > 0 ? (
                  <div className="support-child-stack" aria-label={`Dependencias de ${supportNode.title}`}>
                    {supportNode.children.map((child) => (
                      <div className="support-child-branch" key={child.id}>
                        <OrgCard
                          dimmed={hasActiveFilter && !visibleIds.has(child.id)}
                          node={child}
                          onSelect={onSelect}
                          selected={selectedId === child.id}
                        />
                        {child.children.length > 0 ? (
                          <div className="support-unit-stack">
                            {child.children.map((grandChild) => (
                              <OrgCard
                                dimmed={hasActiveFilter && !visibleIds.has(grandChild.id)}
                                key={grandChild.id}
                                node={grandChild}
                                onSelect={onSelect}
                                selected={selectedId === grandChild.id}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {node.id === "ceo" && node.children.length > 0 ? (
        <div className="org-executive-grid" aria-label="Gerencias del grupo empresarial">
          {node.children.map((child) => (
            <div className="org-executive-column" key={child.id}>
              <OrgCard
                dimmed={hasActiveFilter && !visibleIds.has(child.id)}
                node={child}
                onSelect={onSelect}
                selected={selectedId === child.id}
              />
              {child.children.length > 5 ? (
                <div className="dense-children" aria-label={`Dependencias de ${child.title}`}>
                  {child.children.map((grandChild) => (
                    <OrgCard
                      dimmed={hasActiveFilter && !visibleIds.has(grandChild.id)}
                      key={grandChild.id}
                      node={grandChild}
                      onSelect={onSelect}
                      selected={selectedId === grandChild.id}
                    />
                  ))}
                </div>
              ) : child.children.length > 0 ? (
                <div className="org-card-stack" aria-label={`Dependencias de ${child.title}`}>
                  {child.children.map((grandChild) => (
                    <OrgCard
                      dimmed={hasActiveFilter && !visibleIds.has(grandChild.id)}
                      key={grandChild.id}
                      node={grandChild}
                      onSelect={onSelect}
                      selected={selectedId === grandChild.id}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : node.level !== "Nivel 1" && node.children.length > 5 ? (
        <div className="dense-children" aria-label={`Dependencias de ${node.title}`}>
          {node.children.map((child) => (
            <OrgCard
              dimmed={hasActiveFilter && !visibleIds.has(child.id)}
              key={child.id}
              node={child}
              onSelect={onSelect}
              selected={selectedId === child.id}
            />
          ))}
        </div>
      ) : node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <TreeBranch
              hasActiveFilter={hasActiveFilter}
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              supportNodes={supportNodes}
              visibleIds={visibleIds}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function OrgExperience({ authenticatedProfile = null }: { authenticatedProfile?: AuthenticatedProfile }) {
  const nodes = orgData.nodes as OrgNode[];
  const [selectedId, setSelectedId] = useState(() => {
    const assignedPositionId = authenticatedProfile?.position_id;

    return assignedPositionId && nodes.some((node) => node.id === assignedPositionId)
      ? assignedPositionId
      : nodes[0]?.id ?? "";
  });
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [zoom, setZoom] = useState(1);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [showRoleProfile, setShowRoleProfile] = useState(false);
  const [showPulseForm, setShowPulseForm] = useState(false);
  const [showReportManagement, setShowReportManagement] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const storedReports = window.localStorage.getItem("conecta-weekly-reports");
      return storedReports ? (JSON.parse(storedReports) as WeeklyReport[]) : [];
    } catch {
      return [];
    }
  });
  const [reportNotice, setReportNotice] = useState("");
  const [rocketChatNotice, setRocketChatNotice] = useState("");
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [dashboardFilters, setDashboardFilters] = useState({
    query: "",
    area: "Todas",
    status: "Todos",
    priority: "Todas",
    from: "",
    to: "",
  });
  const [activeAccessRole, setActiveAccessRole] = useState<AccessRoleId>(
    authenticatedProfile?.access_role ?? "superadmin",
  );
  const [weeklyForm, setWeeklyForm] = useState({
    assignmentId: "",
    week: "Semana en curso",
    status: "entregado" as WeeklyReport["status"],
    progress: "",
    completedTasks: "",
    pendingTasks: "",
    evidenceUrl: "",
    evidenceFiles: [] as string[],
    riskType: "operativo",
    priority: "media" as NonNullable<WeeklyReport["priority"]>,
    risks: "",
    decisions: "",
    decisionOwner: "Gerencia inmediata",
    approvalDeadline: "",
    nextActions: "",
  });
  const orgTreeRef = useRef<HTMLDivElement>(null);
  const orgPointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const supportSourceNodes = useMemo(() => {
    const directSupport = nodes.filter((node) => node.reportsTo === "ceo" && node.level === "Nivel 1");
    const directSupportIds = new Set(directSupport.map((node) => node.id));
    const collected = new Map<string, OrgNode>();

    function collectChildren(parentId: string) {
      nodes
        .filter((node) => node.reportsTo === parentId)
        .forEach((child) => {
          collected.set(child.id, child);
          collectChildren(child.id);
        });
    }

    directSupport.forEach((node) => {
      collected.set(node.id, node);
      collectChildren(node.id);
    });

    return Array.from(collected.values()).filter((node) => node.id === "asistente-direccion" || !directSupportIds.has(node.id) || node.level === "Nivel 1");
  }, [nodes]);
  const supportNodes = useMemo(() => buildTree(supportSourceNodes), [supportSourceNodes]);
  const supportIds = useMemo(() => new Set(supportSourceNodes.map((node) => node.id)), [supportSourceNodes]);
  const lineNodes = useMemo(() => nodes.filter((node) => !supportIds.has(node.id)), [nodes, supportIds]);
  const tree = useMemo(() => buildTree(lineNodes), [lineNodes]);
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const areas = useMemo(() => ["Todas", ...Array.from(new Set(nodes.map((node) => node.area)))], [nodes]);
  const statuses = useMemo(
    () => ["Todos", ...Array.from(new Set(nodes.map((node) => node.status)))],
    [nodes],
  );

  const visibleNodes = useMemo(() => {
    const text = normalize(query);

    return nodes.filter((node) => {
      const matchesArea = area === "Todas" || node.area === area;
      const matchesStatus = status === "Todos" || node.status === status;
      const searchable = normalize(
        [
          node.title,
          node.area,
          node.businessUnit,
          node.level,
          node.purpose,
          ...node.tags,
          node.responsibleName ?? "",
          node.identityDocument ?? "",
          node.phone ?? "",
          node.professionalProfile ?? "",
          ...node.processes,
        ].join(" "),
      );

      return matchesArea && matchesStatus && (!text || searchable.includes(text));
    });
  }, [area, nodes, query, status]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const hasActiveFilter = query.trim().length > 0 || area !== "Todas" || status !== "Todos";
  const searchResults = useMemo(() => (hasActiveFilter ? visibleNodes.slice(0, 9) : []), [hasActiveFilter, visibleNodes]);
  const reportes = nodes.filter((node) => node.reportsTo === selected.id);
  const parent = selected.reportsTo ? nodes.find((node) => node.id === selected.reportsTo) : null;
  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const currentAccessProfile = accessProfiles[activeAccessRole];
  const canSimulateRoles = !authenticatedProfile;
  const activeUserName = authenticatedProfile?.full_name ?? "Sesion demo";
  const activeUserEmail = authenticatedProfile?.email ?? "usuario.demo@conecta";
  const operationalAssignments = useMemo(
    () => authenticatedProfile?.assignments ?? [],
    [authenticatedProfile?.assignments],
  );
  const selectedAssignment = useMemo(
    () => operationalAssignments.find((assignment) => assignment.id === weeklyForm.assignmentId)
      ?? operationalAssignments[0]
      ?? null,
    [operationalAssignments, weeklyForm.assignmentId],
  );
  const canUseDashboard = currentAccessProfile.canViewDashboard;
  const canCreatePulse = currentAccessProfile.canCreatePulse;
  const canReviewPulses = currentAccessProfile.canReviewPulse;
  const canViewSensitiveData = currentAccessProfile.canViewSensitiveData;
  const documentValue = selected.identityDocument ?? "Por confirmar";
  const phoneValue = selected.phone ?? "Por confirmar";
  const protectedDocument = (showSensitiveData && canViewSensitiveData) || documentValue === "Por confirmar" ? documentValue : "Documento protegido";
  const protectedPhone = (showSensitiveData && canViewSensitiveData) || phoneValue === "Por confirmar" ? phoneValue : "Telefono protegido";
  const responsibleInitials = (selected.responsibleName ?? selected.title)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const reportDestination = parent?.title ?? "Dirección";
  const selectedReports = useMemo(
    () => weeklyReports.filter((report) => report.roleId === selected.id),
    [selected.id, weeklyReports],
  );
  const latestReport = selectedReports[0];
  const openReport = selectedReports.find((report) => report.id === openReportId) ?? null;
  const isResponsibleView = activeAccessRole === "responsable";
  const responsibleStats = useMemo(() => {
    const pendingReview = selectedReports.filter((report) => report.status === "entregado" || report.reviewStatus === "sin_revision");
    const requestedAdjustments = selectedReports.filter((report) => report.status === "ajuste" || report.reviewStatus === "ajuste");
    const observedReports = selectedReports.filter((report) => report.status === "observado" || report.reviewStatus === "observado");
    const approvedReports = selectedReports.filter((report) => report.status === "aprobado" || report.reviewStatus === "aprobado");
    const escalatedReports = selectedReports.filter((report) => report.status === "escalado" || report.reviewStatus === "escalado");
    const inboundMessages = selectedReports.filter((report) => report.reviewComment?.trim());

    return {
      total: selectedReports.length,
      pendingReview,
      requestedAdjustments,
      observedReports,
      approvedReports,
      escalatedReports,
      inboundMessages,
      recent: selectedReports.slice(0, 4),
    };
  }, [selectedReports]);
  const dashboardAreaOptions = areas;
  const dashboardStatusOptions = ["Todos", "pendiente", "entregado", "observado", "aprobado", "vencido", "ajuste", "escalado"];
  const dashboardPriorityOptions = ["Todas", "baja", "media", "alta", "critica"];
  const enrichedDashboardReports = useMemo(
    () => weeklyReports.map((report) => {
      const role = nodes.find((node) => node.id === report.roleId);

      return {
        ...report,
        area: role?.area ?? "Sin area",
        businessUnit: role?.businessUnit ?? "Sin unidad",
        searchable: normalize([
          report.roleTitle,
          report.responsibleName,
          report.week,
          report.status,
          report.priority ?? report.urgency ?? "",
          report.riskType ?? "",
          report.decisionOwner ?? "",
          report.operationalFrontName ?? "",
          role?.area ?? "",
          role?.businessUnit ?? "",
        ].join(" ")),
      };
    }),
    [nodes, weeklyReports],
  );
  const dashboardScopeIds = useMemo(() => {
    if (activeAccessRole === "superadmin" || activeAccessRole === "direccion" || activeAccessRole === "cultura_conecta") {
      return null;
    }

    const assignedPositionId = authenticatedProfile?.position_id;

    if (activeAccessRole === "gerencia") {
      return assignedPositionId ? getHierarchyScope(assignedPositionId, nodes) : new Set<string>();
    }

    if (activeAccessRole === "responsable") {
      return assignedPositionId ? new Set<string>([assignedPositionId]) : new Set<string>();
    }

    return new Set<string>();
  }, [activeAccessRole, authenticatedProfile?.position_id, nodes]);

  const scopeRoot = authenticatedProfile?.position_id
    ? nodes.find((node) => node.id === authenticatedProfile.position_id)
    : null;
  const scopedDashboardReports = useMemo(
    () => dashboardScopeIds === null
      ? enrichedDashboardReports
      : enrichedDashboardReports.filter((report) => dashboardScopeIds.has(report.roleId)),
    [dashboardScopeIds, enrichedDashboardReports],
  );
  const dashboardScopeLabel = dashboardScopeIds === null
    ? "Sistema completo"
    : scopeRoot
      ? `${scopeRoot.title} y cargos bajo su alcance`
      : "Alcance pendiente por asignar";
  const filteredDashboardReports = useMemo(() => {
    const text = normalize(dashboardFilters.query);
    const fromTime = dashboardFilters.from ? new Date(`${dashboardFilters.from}T00:00:00`).getTime() : null;
    const toTime = dashboardFilters.to ? new Date(`${dashboardFilters.to}T23:59:59`).getTime() : null;

    return scopedDashboardReports.filter((report) => {
      const createdTime = new Date(report.createdAt).getTime();
      const priorityValue = report.priority ?? report.urgency ?? "media";
      const matchesText = !text || report.searchable.includes(text);
      const matchesArea = dashboardFilters.area === "Todas" || report.area === dashboardFilters.area;
      const matchesStatus = dashboardFilters.status === "Todos" || report.status === dashboardFilters.status;
      const matchesPriority = dashboardFilters.priority === "Todas" || priorityValue === dashboardFilters.priority;
      const matchesFrom = fromTime === null || createdTime >= fromTime;
      const matchesTo = toTime === null || createdTime <= toTime;

      return matchesText && matchesArea && matchesStatus && matchesPriority && matchesFrom && matchesTo;
    });
  }, [dashboardFilters, scopedDashboardReports]);
  const dashboardStats = useMemo(() => {
    const statusCount = (target: WeeklyReport["status"]) => filteredDashboardReports.filter((report) => report.status === target).length;
    const highPriority = filteredDashboardReports.filter((report) => report.priority === "alta" || report.priority === "critica" || report.urgency === "alta" || report.urgency === "critica");
    const approvalPending = filteredDashboardReports.filter((report) => report.decisions.trim().length > 0 && report.status !== "aprobado");
    const withEvidence = filteredDashboardReports.filter((report) => report.evidenceUrl || (report.evidenceFiles?.length ?? 0) > 0).length;

    return {
      total: filteredDashboardReports.length,
      allTotal: scopedDashboardReports.length,
      entregados: statusCount("entregado"),
      aprobados: statusCount("aprobado"),
      observados: statusCount("observado"),
      pendientes: statusCount("pendiente") + statusCount("vencido") + statusCount("ajuste") + statusCount("escalado"),
      highPriority,
      approvalPending,
      withEvidence,
      recent: filteredDashboardReports.slice(0, 6),
    };
  }, [filteredDashboardReports, scopedDashboardReports.length]);
  const notificationItems = useMemo(() => {
    const pendingDecisionItems = scopedDashboardReports
      .filter((report) => report.decisions.trim().length > 0 && report.status !== "aprobado")
      .slice(0, 3)
      .map((report) => ({
        id: `decision-${report.id}`,
        roleId: report.roleId,
        tone: "critical",
        label: "Decisión pendiente",
        title: report.roleTitle,
        detail: report.decisionOwner ? `Requiere respuesta de ${report.decisionOwner}` : "Requiere respuesta de gerencia o dirección",
      }));

    const highPriorityItems = scopedDashboardReports
      .filter((report) => report.priority === "alta" || report.priority === "critica" || report.urgency === "alta" || report.urgency === "critica")
      .slice(0, 2)
      .map((report) => ({
        id: `priority-${report.id}`,
        roleId: report.roleId,
        tone: "warning",
        label: "Prioridad alta",
        title: report.roleTitle,
        detail: report.riskType ? `Riesgo: ${report.riskType}` : "Informe marcado para atención",
      }));

    const evidenceItems = scopedDashboardReports
      .filter((report) => report.evidenceUrl || (report.evidenceFiles?.length ?? 0) > 0)
      .slice(0, 2)
      .map((report) => ({
        id: `evidence-${report.id}`,
        roleId: report.roleId,
        tone: "info",
        label: "Evidencia recibida",
        title: report.roleTitle,
        detail: report.evidenceFiles?.[0] ?? report.evidenceUrl ?? "Soporte adjunto",
      }));

    return [...pendingDecisionItems, ...highPriorityItems, ...evidenceItems].slice(0, 6);
  }, [scopedDashboardReports]);
  const roleExperience = {
    title: currentAccessProfile.entryPoint,
    subtitle: currentAccessProfile.label,
    description: activeAccessRole === "responsable"
      ? "Tu entrada prioriza perfil propio, informe de gestión y respuesta a observaciones."
      : activeAccessRole === "gerencia"
        ? "Tu entrada prioriza equipo asignado, informes por revisar y decisiones escalables."
        : activeAccessRole === "direccion"
          ? "Tu entrada prioriza dashboard, decisiones pendientes y lectura total del sistema."
        : activeAccessRole === "cultura_conecta"
            ? "Tu entrada prioriza adopción, método, alertas y calidad del sistema."
            : activeAccessRole === "lector"
              ? "Tu entrada prioriza consulta protegida, lectura autorizada y contexto minimo."
              : "Tu entrada prioriza configuración, auditoría, permisos y control total.",
  };
  const hasDashboardFilters = dashboardFilters.query.trim().length > 0 || dashboardFilters.area !== "Todas" || dashboardFilters.status !== "Todos" || dashboardFilters.priority !== "Todas" || Boolean(dashboardFilters.from) || Boolean(dashboardFilters.to);
  const updateDashboardFilter = (field: keyof typeof dashboardFilters, value: string) => {
    setDashboardFilters((current) => ({ ...current, [field]: value }));
  };
  const clearDashboardFilters = () => {
    setDashboardFilters({ query: "", area: "Todas", status: "Todos", priority: "Todas", from: "", to: "" });
  };
  const getDashboardStatusLabel = (item: string) => (
    item === "Todos" ? item : reportStatusLabels[item as WeeklyReport["status"]] ?? item
  );
  const reportTemplate = {
    period: "Semana en curso",
    dueDate: "Viernes de cada semana",
    objective: `Reportar avances, tareas evacuadas, evidencias, alertas, riesgos y decisiones requeridas asociadas a ${selected.title}.`,
    sections: [
      {
        title: "Resumen ejecutivo",
        prompts: [
          "Principales avances del periodo.",
          "Hechos relevantes, bloqueos o cambios de alcance.",
          `Decisiones que requiere ${reportDestination}.`
        ],
      },
      {
        title: "Indicadores clave",
        prompts: selected.kpis.length > 0
          ? selected.kpis.slice(0, 5)
          : [
              "Cumplimiento de entregables.",
              "Oportunidad de respuesta.",
              "Riesgos gestionados.",
              "Trazabilidad documental."
            ],
      },
      {
        title: "Actividades realizadas",
        prompts: selected.activities.length > 0
          ? selected.activities.flatMap((activity) => activity.subactivities).slice(0, 5)
          : [
              "Actividades ejecutadas durante el periodo.",
              "Entregables completados.",
              "Soportes o evidencias generadas."
            ],
      },
      {
        title: "Riesgos y alertas",
        prompts: selected.risks.length > 0
          ? selected.risks.slice(0, 5)
          : [
              "Riesgos operativos o administrativos detectados.",
              "Bloqueos que requieren decision.",
              "Necesidades de recursos, presupuesto o aprobacion."
            ],
      },
      {
        title: "Plan de accion siguiente periodo",
        prompts: [
          "Tres acciones prioritarias.",
          "Responsable por accion.",
          "Fecha estimada y soporte requerido."
        ],
      },
    ],
  };

  function selectNode(id: string, scrollToDetail = false) {
    setReportNotice("");
    setSelectedId(id);

    if (scrollToDetail) {
      window.setTimeout(() => {
        document.getElementById("detalle")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 160);
    }
  }

  function rememberOrgPointerStart(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    orgPointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function selectOrgCardFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    const start = orgPointerStartRef.current;
    orgPointerStartRef.current = null;

    if (start) {
      const movedX = Math.abs(event.clientX - start.x);
      const movedY = Math.abs(event.clientY - start.y);

      if (movedX > 12 || movedY > 12) return;
    }

    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-node-id]");
    const id = button?.dataset.nodeId;

    if (id) selectNode(id, true);
  }

  function selectSearchResult(id: string) {
    selectNode(id, true);
  }

  async function sendRocketChatPrototypeAlert(input: RocketChatAlertInput) {
    setRocketChatNotice("Enviando alerta a Rocket.Chat...");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No hay sesion activa de Supabase para autorizar la alerta.");
      }

      const response = await fetch("/api/rocket-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? "No se pudo enviar la alerta.");
      }

      if (result?.skipped) {
        setRocketChatNotice("Webhook Rocket.Chat pendiente de configurar. El informe quedo listo para avisar cuando conectemos la URL.");
        return;
      }

      setRocketChatNotice("Alerta enviada a Rocket.Chat.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo enviar la alerta.";
      setRocketChatNotice(`Rocket.Chat: ${message}`);
    }
  }

  function buildLiveMapUrl() {
    if (typeof window === "undefined") return undefined;

    return `${window.location.origin}/mapa-vivo#detalle`;
  }

  function sendRocketChatTestAlert() {
    void sendRocketChatPrototypeAlert({
      type: "test",
      actorName: activeUserName,
      roleTitle: selected.title,
      responsibleName: selected.responsibleName ?? "Por confirmar",
      recipientLabel: reportDestination,
      status: "Prueba operativa",
      priority: "Media",
      week: "Prueba de conexion",
      message: "El timbre de Plataforma Conecta esta listo para avisar movimientos de informes, revisiones y escalamientos.",
      url: buildLiveMapUrl(),
    });
  }

  
  function updateWeeklyForm(field: keyof typeof weeklyForm, value: string) {
    setWeeklyForm((current) => ({ ...current, [field]: value }));
  }

  function updateEvidenceFiles(files: FileList | null) {
    setWeeklyForm((current) => ({
      ...current,
      evidenceFiles: files ? Array.from(files).map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`) : [],
    }));
  }

  function reviewWeeklyReport(reportId: string, reviewStatus: Exclude<NonNullable<WeeklyReport["reviewStatus"]>, "sin_revision">) {
    const actionMessages: Record<typeof reviewStatus, string> = {
      aprobado: "Informe aprobado. El cargo queda con cierre de revision.",
      observado: "Informe observado. Queda abierto para seguimiento gerencial.",
      ajuste: "Ajuste solicitado. El responsable debe complementar el informe de gestion.",
      escalado: "Informe escalado a direccion para decision prioritaria.",
    };
    const reportToReview = weeklyReports.find((report) => report.id === reportId);

    setWeeklyReports((current) =>
      current.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: reviewStatus,
              reviewStatus,
              reviewComment: reviewComment.trim(),
              reviewedAt: new Date().toISOString(),
            }
          : report,
      ),
    );
    setReportNotice(actionMessages[reviewStatus]);

    if (reportToReview) {
      void sendRocketChatPrototypeAlert({
        type: reviewStatus === "escalado" ? "report_escalated" : "report_reviewed",
        actorName: activeUserName,
        roleTitle: reportToReview.roleTitle,
        responsibleName: reportToReview.responsibleName,
        recipientLabel: reviewStatus === "escalado" ? "Direccion" : reportToReview.responsibleName,
        status: reviewActionLabels[reviewStatus],
        priority: reportToReview.priority ?? reportToReview.urgency ?? "media",
        week: reportToReview.week,
        comment: reviewComment.trim(),
        message: actionMessages[reviewStatus],
        url: buildLiveMapUrl(),
      });
    }
  }

  function submitWeeklyReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const report: WeeklyReport = {
      id: `${selected.id}-${Date.now()}`,
      roleId: selected.id,
      roleTitle: selected.title,
      responsibleName: selected.responsibleName ?? "Por confirmar",
      assignmentId: selectedAssignment?.id,
      operationalFrontId: selectedAssignment?.operational_front_id ?? undefined,
      operationalFrontName: selectedAssignment?.operational_front_name,
      week: weeklyForm.week.trim() || "Semana en curso",
      status: weeklyForm.status,
      progress: weeklyForm.progress.trim(),
      completedTasks: weeklyForm.completedTasks.trim(),
      pendingTasks: weeklyForm.pendingTasks.trim(),
      evidenceUrl: weeklyForm.evidenceUrl.trim(),
      evidenceFiles: weeklyForm.evidenceFiles,
      riskType: weeklyForm.riskType,
      priority: weeklyForm.priority,
      risks: weeklyForm.risks.trim(),
      decisions: weeklyForm.decisions.trim(),
      decisionOwner: weeklyForm.decisionOwner.trim(),
      approvalDeadline: weeklyForm.approvalDeadline,
      nextActions: weeklyForm.nextActions.trim(),
      createdAt: new Date().toISOString(),
      reviewStatus: "sin_revision",
    };

    setWeeklyReports((current) => [report, ...current]);
    setOpenReportId(report.id);
    setReviewComment("");
    setReportNotice("Informe de gestion registrado en el prototipo.");
    void sendRocketChatPrototypeAlert({
      type: "report_submitted",
      actorName: activeUserName,
      roleTitle: report.roleTitle,
      responsibleName: report.responsibleName,
      recipientLabel: reportDestination,
      status: reportStatusLabels[report.status],
      priority: report.priority ?? report.urgency ?? "media",
      week: report.week,
      message: report.operationalFrontName
        ? `${report.operationalFrontName}: ${report.progress}`
        : report.progress,
      url: buildLiveMapUrl(),
    });
    setWeeklyForm((current) => ({
      ...current,
      progress: "",
      completedTasks: "",
      pendingTasks: "",
      evidenceUrl: "",
      evidenceFiles: [],
      risks: "",
      decisions: "",
      approvalDeadline: "",
      nextActions: "",
    }));
  }

  const getHorizontalMaxScroll = useCallback((element: HTMLDivElement) => {
    return Math.max(0, element.scrollWidth - element.clientWidth);
  }, []);

  const updateScrollProgress = useCallback((element: HTMLDivElement) => {
    const maxHorizontalScroll = getHorizontalMaxScroll(element);
    const canScrollHorizontally = maxHorizontalScroll > 2;

    setHasHorizontalScroll(canScrollHorizontally);

    if (!canScrollHorizontally) {
      if (element.scrollLeft !== 0) element.scrollLeft = 0;
      setScrollPercent(0);
      return;
    }

    setScrollPercent(Math.round((element.scrollLeft / maxHorizontalScroll) * 100));
  }, [getHorizontalMaxScroll]);

  function syncScrollAfterZoom() {
    window.setTimeout(() => {
      const element = orgTreeRef.current;

      if (element) updateScrollProgress(element);
    }, 160);
  }

  function zoomOut() {
    setZoom((value) => Math.max(0.8, Number((value - 0.1).toFixed(2))));
    syncScrollAfterZoom();
  }

  function zoomIn() {
    setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))));
    syncScrollAfterZoom();
  }

  function resetZoom() {
    setZoom(1);
    window.requestAnimationFrame(() => {
      moveOrgScroll(0);
      const element = orgTreeRef.current;
      if (element) element.scrollTop = 0;
    });
  }

  function moveOrgScroll(value: number) {
    const element = orgTreeRef.current;

    if (!element) return;

    const maxScroll = getHorizontalMaxScroll(element);
    element.scrollLeft = (maxScroll * value) / 100;
    setScrollPercent(value);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const element = orgTreeRef.current;

      if (element) updateScrollProgress(element);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [updateScrollProgress, zoom]);

  useEffect(() => {
    try {
      window.localStorage.setItem("conecta-weekly-reports", JSON.stringify(weeklyReports));
    } catch {
      // Local storage is only a prototype persistence layer.
    }
  }, [weeklyReports]);

  function clearSearch() {
    setQuery("");
    setArea("Todas");
    setStatus("Todos");
  }

  function printView(mode: "org" | "role" | "report") {
    const printWindow = window.open("", "_blank", "width=1400,height=900");

    if (!printWindow) return;

    const title =
      mode === "org"
        ? "Mapa Vivo de Desempeño Cultura Conecta"
        : mode === "report"
          ? `Informe semanal - ${selected.title}`
          : `Ficha de desempeño - ${selected.title}`;
    const root = nodes.find((node) => node.id === "ceo") ?? nodes[0];
    const managers = nodes.filter((node) => node.reportsTo === "ceo" && node.level !== "Nivel 1");

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const renderPillList = (items: string[]) =>
      items.length > 0
        ? `<ul class="print-tags">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p class="print-muted">Sin datos registrados.</p>`;

    const renderOrg = () => `
      <section class="print-org">
        <div class="print-root">
          <div class="print-card print-card--root">${escapeHtml(root.title)}</div>
          <div class="print-support">
            ${supportNodes.map((node) => `<div class="print-card print-card--support">${escapeHtml(node.title)}</div>`).join("")}
          </div>
        </div>
        <div class="print-managers">
          ${managers
            .map((manager) => {
              const units = nodes.filter((node) => node.reportsTo === manager.id);
              return `
                <div class="print-manager">
                  <div class="print-card print-card--manager">
                    <strong>${escapeHtml(manager.title)}</strong>
                    ${manager.subtitle ? `<span>${escapeHtml(manager.subtitle)}</span>` : ""}
                  </div>
                  <div class="print-units">
                    ${units
                      .map((unit) => `<div class="print-card print-card--unit">${escapeHtml(unit.title)}</div>`)
                      .join("")}
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </section>
    `;

    const renderActivity = (activity: ActivityItem) => `
      <article class="print-activity">
        <h4>${escapeHtml(activity.name)}</h4>
        <ul>${activity.subactivities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    `;

    const renderRole = () => `
      <section class="print-role">
        <div class="print-role-head">
          <p>${escapeHtml(selected.area)}</p>
          <h2>${escapeHtml(selected.title)}</h2>
          <span>${escapeHtml(selected.businessUnit)} / ${escapeHtml(parent?.title ?? "Maxima autoridad")}</span>
        </div>

        <section class="print-section print-section--identity">
          <div class="print-section-title">
            <span>Datos del responsable</span>
            <strong>Privacidad activa</strong>
          </div>
          <p class="print-muted">Documento y telefono permanecen ocultos por defecto; el sistema protege datos sensibles mientras permite medir gestion y evidencias.</p>
          <div class="print-identity-grid">
            <article>
              <span>Responsable</span>
              <strong>${escapeHtml(selected.responsibleName ?? "Por confirmar")}</strong>
            </article>
            <article>
              <span>Documento</span>
              <strong>${escapeHtml(protectedDocument)}</strong>
            </article>
            <article>
              <span>Telefono</span>
              <strong>${escapeHtml(protectedPhone)}</strong>
            </article>
            <article>
              <span>Perfil profesional</span>
              <strong>${escapeHtml(selected.professionalProfile ?? "Por confirmar")}</strong>
            </article>
          </div>
        </section>

        <section class="print-section">
          <h3>Proposito del cargo</h3>
          <p>${escapeHtml(selected.purpose)}</p>
        </section>

        <section class="print-section">
          <h3>Responsabilidades principales</h3>
          <ul>${selected.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>

        <section class="print-section">
          <h3>Actividades y subactividades</h3>
          ${selected.activities.map(renderActivity).join("")}
        </section>

        <section class="print-section">
          <h3>Indicadores</h3>
          ${renderPillList(selected.kpis)}
        </section>

        <section class="print-section">
          <h3>Autoridad</h3>
          ${renderPillList(selected.authority)}
        </section>

        <section class="print-section">
          <h3>Procesos</h3>
          ${renderPillList(selected.processes)}
        </section>

        <section class="print-section">
          <h3>Documentos</h3>
          ${renderPillList(selected.documents)}
        </section>

        <section class="print-section">
          <h3>Reportes directos</h3>
          ${renderPillList(reportes.map((node) => node.title))}
        </section>
      </section>
    `;

    const renderReport = () => `
      <section class="print-report">
        <div class="print-report-hero">
          <p>Formato demo de informe semanal</p>
          <h2>${escapeHtml(selected.title)}</h2>
          <span>${escapeHtml(selected.businessUnit)} / Responsable: ${escapeHtml(selected.responsibleName ?? "Por confirmar")}</span>
        </div>

        <div class="print-report-meta">
          <article>
            <span>Periodo</span>
            <strong>${escapeHtml(reportTemplate.period)}</strong>
          </article>
          <article>
            <span>Entrega</span>
            <strong>${escapeHtml(reportTemplate.dueDate)}</strong>
          </article>
          <article>
            <span>Destino</span>
            <strong>${escapeHtml(reportDestination)}</strong>
          </article>
        </div>

        <section class="print-section">
          <h3>Objetivo del informe</h3>
          <p>${escapeHtml(reportTemplate.objective)}</p>
        </section>

        ${reportTemplate.sections
          .map(
            (section) => `
              <section class="print-section print-report-block">
                <h3>${escapeHtml(section.title)}</h3>
                <ul>${section.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ul>
                <div class="print-writing-space"></div>
              </section>
            `,
          )
          .join("")}

        <section class="print-section">
          <h3>Soportes anexos</h3>
          <p class="print-muted">Informes, soportes documentales, evidencias, reportes, actas, registros, anexos o archivos que respalden la gestion del periodo.</p>
          <div class="print-signatures">
            <span>Elabora</span>
            <span>Revisa ${escapeHtml(reportDestination)}</span>
            <span>Recibe Direccion</span>
          </div>
        </section>
      </section>
    `;

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @page { size: ${mode === "org" ? "A4 landscape" : "A4 portrait"}; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #ffffff !important; color: #263238; }
    body { padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print-page { width: 100%; min-height: 100vh; background: #ffffff; }
    .print-cover { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 0 0 16px; padding: 0 0 10px; border-bottom: 2px solid #f45113; }
    .print-cover h1 { margin: 0; color: #2f2f2f; font-size: ${mode === "org" ? "20px" : "24px"}; line-height: 1.12; }
    .print-cover p { margin: 4px 0 0; color: #667085; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0; }
    .print-badge { padding: 7px 10px; border-radius: 999px; background: #fff1e8; color: #f45113; font-size: 11px; font-weight: 900; white-space: nowrap; }
    .print-org { padding-top: 12px; transform: scale(0.72); transform-origin: top left; width: 139%; }
    .print-root { display: grid; justify-items: center; gap: 10px; margin-bottom: 22px; position: relative; }
    .print-support { display: flex; justify-content: center; gap: 14px; }
    .print-managers { display: grid; grid-template-columns: repeat(${managers.length}, 1fr); gap: 10px; align-items: start; padding-top: 26px; position: relative; }
    .print-managers::before { content: ""; height: 0; border-top: 1.5px solid #efb08f; position: absolute; top: 0; left: calc((100% - ${(managers.length - 1) * 10}px) / ${managers.length * 2}); right: calc((100% - ${(managers.length - 1) * 10}px) / ${managers.length * 2}); }
    .print-manager { display: grid; justify-items: center; gap: 12px; position: relative; }
    .print-manager::before { content: ""; width: 0; height: 26px; border-left: 1.5px solid #efb08f; position: absolute; top: -26px; left: 50%; }
    .print-card { display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.04; border-radius: 12px; font-weight: 800; color: #263238; }
    .print-card--root { width: 112px; height: 42px; border: 1.5px solid #efb08f; background: #fff; }
    .print-card--support { width: 118px; min-height: 40px; padding: 7px; border: 1px solid #d8c7a3; background: #f7f1df; font-size: 11px; }
    .print-card--manager { width: 124px; min-height: 62px; padding: 8px; border: 1px solid #efb08f; background: linear-gradient(180deg, #fff7f1, #ffe4d4); font-size: 12px; }
    .print-card--manager { flex-direction: column; gap: 3px; }
    .print-card--manager span { font-size: 9px; font-weight: 700; color: #667085; }
    .print-units { display: grid; gap: 8px; justify-items: center; }
    .print-card--unit { width: 74px; min-height: 48px; padding: 6px; border: 1px solid #cbd5df; background: #f7fafc; font-size: 9px; }
    .print-role-head { margin-bottom: 16px; }
    .print-role-head p { margin: 0 0 8px; color: #287a76; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .print-role-head h2 { margin: 0; font-size: 30px; color: #2f2f2f; }
    .print-role-head span { display: block; margin-top: 8px; color: #667085; font-weight: 700; }
    .print-report-hero { margin-bottom: 14px; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, #fff7f1, #ffffff); border: 1px solid #ffd6c1; }
    .print-report-hero p { margin: 0 0 8px; color: #f45113; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .print-report-hero h2 { margin: 0; color: #2f2f2f; font-size: 30px; }
    .print-report-hero span { display: block; margin-top: 8px; color: #667085; font-weight: 700; }
    .print-report-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
    .print-report-meta article { border: 1px solid #e3e8ee; border-radius: 12px; padding: 12px; background: #fbfcfd; }
    .print-report-meta span { display: block; color: #287a76; font-size: 10px; font-weight: 900; text-transform: uppercase; }
    .print-report-meta strong { display: block; margin-top: 5px; font-size: 13px; color: #263238; }
    .print-section { break-inside: avoid; page-break-inside: avoid; border: 1px solid #e3e8ee; border-radius: 14px; background: #ffffff; padding: 15px 18px; margin: 10px 0; }
    .print-section h3 { margin: 0 0 10px; color: #287a76; font-size: 17px; }
    .print-section p, .print-section li { font-size: 13px; line-height: 1.45; }
    .print-section ul { margin: 8px 0 0; padding-left: 18px; }
    .print-section-title { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
    .print-section-title span { color: #287a76; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .print-section-title strong { color: #263238; }
    .print-muted { color: #667085; margin: 0 0 12px; }
    .print-identity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .print-identity-grid article { border: 1px solid #edf0f4; border-radius: 12px; padding: 10px; background: #fbfcfd; }
    .print-identity-grid span { display: block; color: #f45113; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
    .print-identity-grid strong { display: block; color: #263238; font-size: 13px; }
    .print-activity { border-top: 1px solid #edf0f4; padding-top: 10px; margin-top: 10px; }
    .print-activity h4 { margin: 0 0 6px; font-size: 14px; }
    .print-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .print-tags li { padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .print-writing-space { min-height: 78px; margin-top: 12px; border: 1px dashed #cbd5df; border-radius: 12px; background: repeating-linear-gradient(#ffffff, #ffffff 23px, #f1f5f9 24px); }
    .print-signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 36px; }
    .print-signatures span { display: block; padding-top: 8px; border-top: 1px solid #9aa7b2; color: #667085; font-size: 11px; font-weight: 800; text-align: center; }
    @media print { .print-page { min-height: auto; } }
  </style>
</head>
<body>
  <main class="print-page ${mode === "org" ? "print-page--org" : "print-page--role"}">
    <header class="print-cover">
      <div>
        <p>Cultura Conecta</p>
        <h1>${title}</h1>
      </div>
      <span class="print-badge">Cultura Conecta</span>
    </header>
    ${mode === "org" ? renderOrg() : mode === "report" ? renderReport() : renderRole()}
  </main>
  <script>
    window.addEventListener('load', () => {
      window.setTimeout(() => {
        document.body.offsetHeight;
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`);
    printWindow.document.close();
  }
  return (
    <main className="org-shell">
      <header className="org-hero org-hero--institutional">
        <nav className="org-nav" aria-label="Navegacion principal">
          <a href="#" className="brand-mark brand-mark--logo" aria-label="Cultura Conecta">
            <Image
              alt="Cultura Conecta"
              className="nav-logo"
              height={1165}
              priority
              src="/brand/cultura-conecta-isotipo-3d.png"
              width={1350}
            />
          </a>
          <div className="org-nav__links">
            <a href="#organigrama">Mapa vivo</a>
            <a href="#detalle">Informe de gestión</a>
            <a href="#estandar">Método</a>
          </div>
        </nav>

        <section className="org-hero__content">
          <div className="hero-brand-stage">
            <Image
              alt="Cultura Conecta"
              className="hero-logo"
              height={2048}
              priority
              src="/brand/cultura-conecta-floating-logo.png"
              width={2048}
            />
          </div>
          <div className="hero-copy-panel">
            <p className="eyebrow">Cultura Conecta | Evolucion organizacional</p>
            <h1>Mapa vivo de desempeño</h1>
            <p className="hero-copy">
              No evaluamos personas. Visualizamos responsabilidades, evidencias, alertas y ritmos de gestión para comprender cómo avanza el sistema organizacional.
            </p>
          </div>
          <div className="hero-status-panel" aria-label="Resumen del prototipo">
            <div>
              <span>{nodes.length}</span>
              <p>Cargos conectados</p>
            </div>
            <div>
              <span>{areas.length - 1}</span>
              <p>Áreas visibles</p>
            </div>
            <div>
              <span>{visibleNodes.length}</span>
              <p>Resultados activos</p>
            </div>
          </div>
        </section>
      </header>

      <section className={`session-strip session-strip--${activeAccessRole}`} aria-label="Sesión activa de Plataforma Conecta">
        <div className="session-strip__identity">
          <div>
            <p className="eyebrow">{canSimulateRoles ? "Modo demostración" : "Sesión activa"}</p>
            <strong>{currentAccessProfile.label}</strong>
            <span>{activeUserName} / {currentAccessProfile.scope}</span>
            <small>{activeUserEmail}</small>
          </div>
          <ShieldCheck aria-hidden="true" size={22} />
        </div>
        {canSimulateRoles ? (
          <label className="session-strip__selector">
            <span>Simular vista</span>
            <select onChange={(event) => setActiveAccessRole(event.target.value as AccessRoleId)} value={activeAccessRole}>
              {(Object.keys(accessProfiles) as AccessRoleId[]).map((roleId) => (
                <option key={roleId} value={roleId}>{accessProfiles[roleId].label}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="session-strip__locked">
            <span>Vista asignada</span>
            <strong>{currentAccessProfile.entryPoint}</strong>
          </div>
        )}
        <div className="session-strip__permissions" aria-label="Permisos del perfil activo">
          <span>{canUseDashboard ? "Dashboard" : "Sin dashboard"}</span>
          <span>{canCreatePulse ? "Crea informes" : "No crea informes"}</span>
          <span>{canReviewPulses ? "Revisa informes" : "Solo consulta"}</span>
          <span>{canViewSensitiveData ? "Datos sensibles" : "Datos protegidos"}</span>
        </div>
      </section>

      <section className="notification-dock" aria-label="Bandeja de notificaciones Conecta">
        <div className="notification-dock__profile">
          <span>Vista activa</span>
          <strong>{roleExperience.title}</strong>
          <p>{roleExperience.description}</p>
        </div>
        <details className="notification-dock__tray">
          <summary>
            <div>
              <span>{notificationItems.length}</span>
              <strong>Alertas operativas</strong>
            </div>
            <p>{notificationItems.length > 0 ? "Revisar señales recientes del sistema" : "Sin alertas demo registradas"}</p>
            <ChevronRight aria-hidden="true" size={18} />
          </summary>
          {notificationItems.length > 0 ? (
            <div className="notification-dock__list">
              {notificationItems.map((item) => (
                <button className={`notification-item notification-item--${item.tone}`} key={item.id} onClick={() => selectNode(item.roleId, true)} type="button">
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="notification-dock__empty">Cuando se guarden informes, la bandeja mostrara acuses, decisiones, vencimientos y evidencias.</p>
          )}
        </details>
      </section>

      <section className="org-toolbar" aria-label="Filtros del mapa vivo">
        <label className="search-field">
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Buscar cargo, tarea, evidencia o alerta"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) {
                selectSearchResult(searchResults[0].id);
              }
            }}            placeholder="Buscar cargo, tarea, evidencia o alerta"
            value={query}
          />
        </label>

        <label className="select-field">
          <Filter aria-hidden="true" size={17} />
          <select aria-label="Filtrar por area" onChange={(event) => setArea(event.target.value)} value={area}>
            {areas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <CircleDot aria-hidden="true" size={17} />
          <select
            aria-label="Filtrar por estado"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item] ?? item}
              </option>
            ))}
          </select>
        </label>
      </section>

      {canUseDashboard ? (
      <section className={`executive-dashboard executive-dashboard--${activeAccessRole}`} aria-label="Dashboard directivo de desempeño">
        <div className="executive-dashboard__header">
          <div>
            <p className="eyebrow">Dashboard directivo</p>
            <h2>Informes de gestión del sistema</h2>
            <small>{dashboardScopeLabel}</small>
          </div>
          <span>
            {dashboardStats.allTotal > 0
              ? `${dashboardStats.total} de ${dashboardStats.allTotal} informes visibles`
              : "Sin informes registrados"}
          </span>
        </div>

        <div className="executive-dashboard__filters" aria-label="Filtros del dashboard directivo">
          <label className="executive-filter executive-filter--search">
            <Search aria-hidden="true" size={16} />
            <input
              onChange={(event) => updateDashboardFilter("query", event.target.value)}
              placeholder="Buscar por cargo, responsable o palabra clave"
              type="search"
              value={dashboardFilters.query}
            />
          </label>

          <label className="executive-filter">
            <span>Area</span>
            <select onChange={(event) => updateDashboardFilter("area", event.target.value)} value={dashboardFilters.area}>
              {dashboardAreaOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="executive-filter">
            <span>Estado</span>
            <select onChange={(event) => updateDashboardFilter("status", event.target.value)} value={dashboardFilters.status}>
              {dashboardStatusOptions.map((item) => (
                <option key={item} value={item}>{getDashboardStatusLabel(item)}</option>
              ))}
            </select>
          </label>

          <label className="executive-filter">
            <span>Prioridad</span>
            <select onChange={(event) => updateDashboardFilter("priority", event.target.value)} value={dashboardFilters.priority}>
              {dashboardPriorityOptions.map((item) => (
                <option key={item} value={item}>{item === "Todas" ? item : item.charAt(0).toUpperCase() + item.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className="executive-filter">
            <span>Desde</span>
            <input onChange={(event) => updateDashboardFilter("from", event.target.value)} type="date" value={dashboardFilters.from} />
          </label>

          <label className="executive-filter">
            <span>Hasta</span>
            <input onChange={(event) => updateDashboardFilter("to", event.target.value)} type="date" value={dashboardFilters.to} />
          </label>

          <button className="executive-dashboard__clear" disabled={!hasDashboardFilters} onClick={clearDashboardFilters} type="button">
            Limpiar filtros
          </button>
        </div>

        <div className="executive-dashboard__kpis">
          <article>
            <small>Informes</small>
            <strong>{dashboardStats.total}</strong>
            <p>Total capturado</p>
          </article>
          <article>
            <small>Aprobados</small>
            <strong>{dashboardStats.aprobados}</strong>
            <p>Con revision cerrada</p>
          </article>
          <article>
            <small>Observados</small>
            <strong>{dashboardStats.observados}</strong>
            <p>Requieren ajuste</p>
          </article>
          <article>
            <small>Pendientes</small>
            <strong>{dashboardStats.pendientes}</strong>
            <p>Pendiente o vencido</p>
          </article>
          <article>
            <small>Prioridad alta</small>
            <strong>{dashboardStats.highPriority.length}</strong>
            <p>Alta o critica</p>
          </article>
          <article>
            <small>Evidencias</small>
            <strong>{dashboardStats.withEvidence}</strong>
            <p>Con soporte</p>
          </article>
        </div>

        <div className="executive-dashboard__focus">
          <article>
            <div>
              <p className="eyebrow">Atención directiva</p>
              <h3>Aprobaciones pendientes</h3>
            </div>
            {dashboardStats.approvalPending.length > 0 ? (
              <ul>
                {dashboardStats.approvalPending.slice(0, 4).map((report) => (
                  <li key={report.id}>
                    <button onClick={() => selectNode(report.roleId, true)} type="button">
                      <strong>{report.roleTitle}</strong>
                      <span>{report.week} / {report.decisionOwner ?? "Gerencia inmediata"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay aprobaciones pendientes registradas.</p>
            )}
          </article>

          <article>
            <div>
              <p className="eyebrow">Últimos registros</p>
              <h3>Actividad reciente</h3>
            </div>
            {dashboardStats.recent.length > 0 ? (
              <ul>
                {dashboardStats.recent.map((report) => (
                  <li key={report.id}>
                    <button onClick={() => selectNode(report.roleId, true)} type="button">
                      <strong>{report.roleTitle}</strong>
                      <span>{reportStatusLabels[report.status]} / prioridad {report.priority ?? report.urgency ?? "media"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Los informes guardados aparecerán aquí como bandeja de gestión.</p>
            )}
          </article>
        </div>
      </section>
      ) : isResponsibleView ? (
        <section className="personal-dashboard" aria-label="Dashboard personal del responsable">
          <div className="personal-dashboard__header">
            <div>
              <p className="eyebrow">Mi tablero Conecta</p>
              <h2>Interacción de mi cargo</h2>
              <p>
                Aquí el responsable consulta lo que ha registrado, lo que está pendiente de revisión y las respuestas que recibe de gerencia o dirección.
              </p>
            </div>
            <span>{selected.title}</span>
          </div>

          <div className="personal-dashboard__kpis">
            <article>
              <small>Informes enviados</small>
              <strong>{responsibleStats.total}</strong>
              <p>Historial del cargo</p>
            </article>
            <article>
              <small>En revisión</small>
              <strong>{responsibleStats.pendingReview.length}</strong>
              <p>Esperando lectura superior</p>
            </article>
            <article>
              <small>Ajustes solicitados</small>
              <strong>{responsibleStats.requestedAdjustments.length}</strong>
              <p>Requieren complemento</p>
            </article>
            <article>
              <small>Mensajes recibidos</small>
              <strong>{responsibleStats.inboundMessages.length}</strong>
              <p>Notas de gerencia o dirección</p>
            </article>
          </div>

          <div className="personal-dashboard__body">
            <article className="personal-dashboard__card">
              <div>
                <p className="eyebrow">Bandeja personal</p>
                <h3>Lo que debo atender</h3>
              </div>
              {responsibleStats.requestedAdjustments.length > 0 || responsibleStats.observedReports.length > 0 || responsibleStats.escalatedReports.length > 0 ? (
                <ul>
                  {[...responsibleStats.requestedAdjustments, ...responsibleStats.observedReports, ...responsibleStats.escalatedReports].slice(0, 4).map((report) => (
                    <li key={report.id}>
                      <button onClick={() => {
                        selectNode(report.roleId, true);
                        setOpenReportId(report.id);
                        setShowReportManagement(true);
                      }} type="button">
                        <strong>{reviewActionLabels[report.reviewStatus ?? "sin_revision"] ?? reportStatusLabels[report.status]}</strong>
                        <span>{report.week} / {report.reviewComment || "Revisar indicación del superior"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No tienes observaciones, ajustes o escalaciones abiertas para este cargo.</p>
              )}
            </article>

            <article className="personal-dashboard__card">
              <div>
                <p className="eyebrow">Mi actividad</p>
                <h3>Últimos informes</h3>
              </div>
              {responsibleStats.recent.length > 0 ? (
                <ul>
                  {responsibleStats.recent.map((report) => (
                    <li key={report.id}>
                      <button onClick={() => {
                        selectNode(report.roleId, true);
                        setOpenReportId(report.id);
                        setShowReportManagement(true);
                      }} type="button">
                        <strong>{report.week}</strong>
                        <span>{reportStatusLabels[report.status]} / prioridad {report.priority ?? report.urgency ?? "media"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aún no hay informes registrados para este cargo. El primer registro alimentará tu tablero personal.</p>
              )}
            </article>

            <article className="personal-dashboard__card personal-dashboard__card--next">
              <div>
                <p className="eyebrow">Próximo movimiento</p>
                <h3>Informe de gestión</h3>
              </div>
              <p>
                Abre el perfil del cargo y registra tu informe semanal con avances, evidencias, alertas y decisiones requeridas.
              </p>
              <button onClick={() => {
                setShowReportManagement(true);
                setShowPulseForm(true);
                document.getElementById("detalle")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }} type="button">
                Abrir informe de gestión
              </button>
            </article>
          </div>
        </section>
      ) : (
        <section className="access-restricted-panel" aria-label="Dashboard restringido">
          <p className="eyebrow">Vista protegida</p>
          <h2>Dashboard reservado para gobierno y acompañamiento.</h2>
          <p>Esta vista consulta información autorizada, pero no interviene informes, decisiones ni datos sensibles del sistema.</p>
        </section>
      )}
      {hasActiveFilter ? (
        <section className="search-results-panel" aria-live="polite">
          <div className="search-results-panel__summary">
            <div>
              <p className="eyebrow">Resultados de busqueda</p>
              <strong>{visibleNodes.length} coincidencias</strong>
            </div>
            <button className="search-clear" onClick={clearSearch} type="button">
              Limpiar
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="search-results-list">
              {searchResults.map((node) => (
                <button key={node.id} onClick={() => selectSearchResult(node.id)} type="button">
                  <span>{node.title}</span>
                  <small>
                    {node.area} / {node.businessUnit}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p className="search-empty">No encontramos coincidencias con esos filtros.</p>
          )}
        </section>
      ) : null}

      <section className="workspace-grid" id="organigrama">
        <div className="org-map" aria-label="Mapa de cargos">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mapa vivo</p>
              <h2>Desempeño por cargo</h2>
            </div>
            <div className="map-actions" aria-label="Controles de visualizacion del mapa vivo">
              <span className="version-pill">{orgData.version}</span>
              <button className="export-button" onClick={() => printView("org")} type="button">
                <Download aria-hidden="true" size={15} />
                PDF mapa
              </button>
              <div className="zoom-controls" aria-label="Zoom del mapa vivo">
                <button
                  aria-label="Alejar mapa vivo"
                  onClick={zoomOut}
                  onTouchEnd={(event) => { event.preventDefault(); zoomOut(); }}
                  type="button"
                >
                  <ZoomOut aria-hidden="true" size={15} />
                </button>
                <span>{zoomLabel}</span>
                <button
                  aria-label="Acercar mapa vivo"
                  onClick={zoomIn}
                  onTouchEnd={(event) => { event.preventDefault(); zoomIn(); }}
                  type="button"
                >
                  <ZoomIn aria-hidden="true" size={15} />
                </button>
                <button aria-label="Restablecer zoom" onClick={resetZoom} onTouchEnd={(event) => { event.preventDefault(); resetZoom(); }} type="button">
                  <RotateCcw aria-hidden="true" size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="org-map-viewport">
            <div
              className="org-tree-wrap"
              onPointerDownCapture={rememberOrgPointerStart}
              onPointerUpCapture={selectOrgCardFromPointer}
              onScroll={(event) => updateScrollProgress(event.currentTarget)}
              ref={orgTreeRef}
            >
            <div className="org-zoom-stage" style={{
                "--org-zoom": zoom,
                "--org-zoom-extra-x": `${Math.max(0, zoom - 1) * 2800}px`,
                "--org-zoom-extra-y": `${Math.max(0, zoom - 1) * 980}px`,
              } as React.CSSProperties}>
              <ul className="org-tree">
                {tree.map((node) => (
                  <TreeBranch
                    hasActiveFilter={hasActiveFilter}
                    key={node.id}
                    node={node}
                    onSelect={(id) => selectNode(id, true)}
                    selectedId={selected.id}
                    supportNodes={supportNodes}
                    visibleIds={visibleIds}
                  />
                ))}
              </ul>
            </div>
          </div>
          </div>
          <div className="org-scroll-control" aria-label="Navegacion del organigrama">
            <div className="org-scroll-control__zoom" aria-label="Zoom rapido del organigrama">
              <button aria-label="Alejar mapa vivo" onClick={zoomOut} onTouchEnd={(event) => { event.preventDefault(); zoomOut(); }} type="button">
                <ZoomOut aria-hidden="true" size={14} />
              </button>
              <strong>{zoomLabel}</strong>
              <button aria-label="Acercar mapa vivo" onClick={zoomIn} onTouchEnd={(event) => { event.preventDefault(); zoomIn(); }} type="button">
                <ZoomIn aria-hidden="true" size={14} />
              </button>
              <button aria-label="Restablecer zoom" onClick={resetZoom} onTouchEnd={(event) => { event.preventDefault(); resetZoom(); }} type="button">
                <RotateCcw aria-hidden="true" size={13} />
              </button>
            </div>
            <label className="org-scroll-control__track">
              <span>Mapa</span>
              <input
                aria-label="Mover mapa vivo horizontalmente"
                disabled={!hasHorizontalScroll}
                max="100"
                min="0"
                onChange={(event) => moveOrgScroll(Number(event.target.value))}
                onInput={(event) => moveOrgScroll(Number(event.currentTarget.value))}
                type="range"
                value={scrollPercent}
              />
            </label>
          </div>
        </div>

        <aside className="role-panel" id="detalle" aria-label="Informe de gestion y detalle del cargo seleccionado">
          <div className="role-panel__header">
            <div>
              <p className="eyebrow">{selected.area}</p>
              <h2>{selected.title}</h2>
            </div>
            <div className="role-panel__actions">
              <button className="export-button export-button--light export-button--accent" onClick={() => printView("report")} type="button">
                <FileText aria-hidden="true" size={15} />
                Informe semanal
              </button>
              <button className="export-button export-button--light" onClick={() => printView("role")} type="button">
                <Printer aria-hidden="true" size={15} />
                Imprimir ficha
              </button>
              <span className={`role-status role-status--${selected.status}`}>
                {statusLabels[selected.status] ?? selected.status}
              </span>
            </div>
          </div>

          <div className="lineage">
            <span>
              <Building2 aria-hidden="true" size={15} />
              {selected.businessUnit}
            </span>
            <ChevronRight aria-hidden="true" size={15} />
            <span>{parent?.title ?? "Maxima autoridad"}</span>
          </div>

          <section className="performance-pulse performance-pulse--agenda" aria-label="Agenda de seguimiento del cargo">
            <div className="performance-pulse__heading">
              <p className="eyebrow">Agenda del cargo</p>
              <strong>Seguimiento, estado y rendicion de cuentas sin saturar la lectura.</strong>
            </div>
            <div className="performance-pulse__grid">
              <article>
                <span className="pulse-dot pulse-dot--green" />
                <small>Proximo informe</small>
                <strong>{weeklyForm.week}</strong>
              </article>
              <article>
                <span className="pulse-dot pulse-dot--lime" />
                <small>Estado del informe</small>
                <strong>{latestReport ? reportStatusLabels[latestReport.status] : "Sin registro"}</strong>
              </article>
              <article>
                <span className="pulse-dot pulse-dot--amber" />
                <small>Proxima reunion Conecta</small>
                <strong>Por programar</strong>
              </article>
            </div>
          </section>

          <section className={showRoleProfile ? "role-identity role-identity--open" : "role-identity role-identity--collapsed"} aria-label="Perfil del cargo">
            <div className="role-identity__topline">
              <div>
                <p className="eyebrow">Perfil del cargo</p>
                <strong>{selected.responsibleName ?? "Responsable por confirmar"}</strong>
                <small>{selected.title} / {selected.businessUnit}</small>
              </div>
              <div className="role-identity__actions">
                <button
                  aria-expanded={showRoleProfile}
                  className="profile-toggle"
                  onClick={() => setShowRoleProfile((value) => !value)}
                  type="button"
                >
                  <UserRound aria-hidden="true" size={16} />
                  {showRoleProfile ? "Ocultar perfil" : "Perfil del cargo"}
                </button>
                {showRoleProfile ? (
                  <button
                    aria-pressed={showSensitiveData && canViewSensitiveData}
                    className="privacy-toggle"
                    disabled={!canViewSensitiveData}
                    onClick={() => setShowSensitiveData((value) => !value)}
                    type="button"
                  >
                    <ShieldCheck aria-hidden="true" size={16} />
                    {showSensitiveData ? "Ocultar datos" : "Mostrar datos"}
                  </button>
                ) : null}
              </div>
            </div>
            {!showRoleProfile ? (
              <p className="privacy-note">Informacion de contexto protegida. Abre el perfil cuando necesites datos del responsable, documento, telefono o perfil profesional.</p>
            ) : (
              <>
                <p className="privacy-note">Documento y telefono permanecen ocultos por defecto; el sistema protege datos sensibles mientras permite medir gestion y evidencias.</p>
                <div className="role-profile-showcase">
                  <article className="role-business-card conecta-profile-card" aria-label="Perfil Conecta del responsable del cargo">
                    <div className="conecta-profile-card__cover" aria-hidden="true">
                      <Image
                        alt=""
                        className={selected.coverPhoto ? "conecta-profile-card__cover-media conecta-profile-card__cover-media--photo" : "conecta-profile-card__cover-media"}
                        fill
                        priority={false}
                        sizes="(max-width: 900px) 100vw, 900px"
                        src={selected.coverPhoto ?? "/brand/cultura-conecta-isotipo-3d.png"}
                      />
                    </div>

                    <div className="conecta-profile-card__identity">
                      <div className="role-business-card__avatar conecta-profile-card__avatar" aria-hidden="true">
                        {selected.photo ? (
                          <Image alt="" height={120} src={selected.photo} width={120} />
                        ) : (
                          <span>{responsibleInitials}</span>
                        )}
                      </div>
                      <div className="conecta-profile-card__headline">
                        <span>Perfil Conecta</span>
                        <h4>{selected.responsibleName ?? "Por confirmar"}</h4>
                        <small>{selected.title} / {selected.businessUnit}</small>
                      </div>
                      <span className="conecta-profile-card__status"><CircleDot aria-hidden="true" size={12} />{latestReport ? reportStatusLabels[latestReport.status] : "Sin registro"}</span>
                    </div>

                    <p className="conecta-profile-card__bio">{selected.professionalProfile ?? selected.profile.join(". ")}</p>

                    <dl className="role-business-card__meta conecta-profile-card__meta">
                      <div>
                        <IdCard aria-hidden="true" size={18} />
                        <dt>Documento</dt>
                        <dd className={!showSensitiveData && documentValue !== "Por confirmar" ? "sensitive-value" : undefined}>{protectedDocument}</dd>
                      </div>
                      <div>
                        <Phone aria-hidden="true" size={18} />
                        <dt>Telefono</dt>
                        <dd className={!showSensitiveData && phoneValue !== "Por confirmar" ? "sensitive-value" : undefined}>{protectedPhone}</dd>
                      </div>
                    </dl>

                    <div className="conecta-profile-card__signals" aria-label="Indicadores rapidos del perfil">
                      <div>
                        <strong>{selectedReports.length}</strong>
                        <span>Informes</span>
                      </div>
                      <div>
                        <strong>{reportes.length}</strong>
                        <span>Reportes</span>
                      </div>
                      <div>
                        <strong>{selected.kpis.length}</strong>
                        <span>Indicadores</span>
                      </div>
                    </div>

                    <div className="conecta-profile-card__actions" aria-label="Acciones del perfil">
                      <button type="button">
                        <FileText aria-hidden="true" size={14} />
                        Ver informes
                      </button>
                      <button type="button">
                        <Network aria-hidden="true" size={14} />
                        Red interna
                      </button>
                    </div>
                  </article>

                </div>

                <div className="role-identity__purpose">
                  <Target aria-hidden="true" size={18} />
                  <div>
                    <span>Proposito del cargo</span>
                    <p>{selected.purpose}</p>
                  </div>
                </div>
                <div className="role-profile-sections">
                  <DetailSection icon={BriefcaseBusiness} title="Responsabilidades principales">
                    <ul className="compact-list">
                      {selected.responsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </DetailSection>

                  <DetailSection icon={Activity} title="Actividades y subactividades">
                    <div className="activity-list">
                      {selected.activities.map((activity) => (
                        <article key={activity.name}>
                          <h4>{activity.name}</h4>
                          <ul>
                            {activity.subactivities.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </DetailSection>

                  <div className="detail-grid">
                    <DetailSection icon={BarChart3} title="Indicadores">
                      <ul className="tag-list">
                        {selected.kpis.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </DetailSection>

                    <DetailSection icon={ShieldCheck} title="Autoridad">
                      <ul className="tag-list">
                        {selected.authority.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </DetailSection>
                  </div>

                  <div className="detail-grid">
                    <DetailSection icon={Network} title="Procesos">
                      <ul className="tag-list">
                        {selected.processes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </DetailSection>

                    <DetailSection icon={FileText} title="Documentos">
                      <ul className="tag-list">
                        {selected.documents.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </DetailSection>
                  </div>

                  <DetailSection icon={Layers} title="Reportes directos">
                    <div className="reports-list">
                      {reportes.length > 0 ? (
                        reportes.map((node) => (
                          <button key={node.id} onClick={() => setSelectedId(node.id)} type="button">
                            {node.title}
                          </button>
                        ))
                      ) : (
                        <p className="detail-copy">Este cargo no registra reportes directos en el prototipo.</p>
                      )}
                    </div>
                  </DetailSection>
                </div>
              </>
            )}
          </section>

          <section className={showReportManagement ? "conecta-report-form conecta-report-form--open" : "conecta-report-form conecta-report-form--collapsed"} aria-label="Gestion de informes del cargo">
            <div className="conecta-report-form__header">
              <div>
                <p className="eyebrow">Gestion de informes</p>
                <h3>Informes de gestion y rendicion de cuentas</h3>
                <small>{selected.title} / {selected.businessUnit}</small>
              </div>
              <div className="conecta-report-form__actions">
                <span>{selectedReports.length} registros</span>
                <button
                  aria-expanded={showReportManagement}
                  className="pulse-form-toggle"
                  onClick={() => setShowReportManagement((value) => !value)}
                  type="button"
                >
                  <FileText aria-hidden="true" size={16} />
                  {showReportManagement ? "Ocultar gestion" : "Gestion de informes"}
                </button>
              </div>
            </div>
            <p className="conecta-report-form__intro">
              {showReportManagement
                ? "Consulta el ultimo informe de gestion, abre el historial y registra nuevos informes cuando corresponda."
                : "La gestion de informes permanece cerrada para mantener la vista limpia. Abrela para ver historial, ultimo informe o registrar uno nuevo."}
            </p>

            {showReportManagement ? (
              <>
                {operationalAssignments.length > 0 ? (
                  <div className="operational-fronts-panel" aria-label="Frentes de gestion asignados">
                    <div className="operational-fronts-panel__header">
                      <span>
                        <Layers aria-hidden="true" size={16} />
                        Frentes vivos asignados
                      </span>
                      <small>{operationalAssignments.length} frentes conectados a este perfil</small>
                    </div>
                    <div className="operational-fronts-panel__list">
                      {operationalAssignments.map((assignment) => (
                        <span
                          className={
                            assignment.is_primary
                              ? "operational-front-chip operational-front-chip--primary"
                              : "operational-front-chip"
                          }
                          key={assignment.id}
                        >
                          {assignment.operational_front_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {latestReport ? (
                  <div className="latest-report-card" aria-label="Ultimo informe registrado">
                    <small>Ultimo informe registrado</small>
                    <strong>
                      {latestReport.week} / {reportStatusLabels[latestReport.status]}
                      {latestReport.operationalFrontName ? ` / ${latestReport.operationalFrontName}` : ""}
                    </strong>
                    <p>{latestReport.progress || "Sin resumen registrado."}</p>
                  </div>
                ) : null}

                <div className="report-management-actions">
                  <button
                    className="pulse-form-toggle pulse-form-toggle--secondary"
                    onClick={sendRocketChatTestAlert}
                    type="button"
                  >
                    <Network aria-hidden="true" size={16} />
                    Probar Rocket.Chat
                  </button>
                  <button
                    aria-expanded={showPulseForm}
                    className="pulse-form-toggle pulse-form-toggle--secondary"
                    onClick={() => setShowPulseForm((value) => !value)}
                    type="button"
                  >
                    <FileText aria-hidden="true" size={16} />
                    {showPulseForm ? "Ocultar formulario" : "Abrir informe de gestión"}
                  </button>
                </div>
                {rocketChatNotice ? <p className="report-management-notice">{rocketChatNotice}</p> : null}

                {showPulseForm ? (
                  canCreatePulse ? (
            <form className="weekly-report-form" onSubmit={submitWeeklyReport}>
              {operationalAssignments.length > 0 ? (
                <div className="operational-front-selector">
                  <div>
                    <span>
                      <Layers aria-hidden="true" size={16} />
                      Frente de gestión
                    </span>
                    <p>Selecciona el frente real desde donde nace este informe.</p>
                  </div>
                  <select
                    onChange={(event) => updateWeeklyForm("assignmentId", event.target.value)}
                    value={weeklyForm.assignmentId || selectedAssignment?.id || ""}
                  >
                    {operationalAssignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.operational_front_name}
                        {assignment.is_primary ? " / Principal" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="weekly-report-form__grid">
                <label>
                  <span>Periodo reportado</span>
                  <input
                    onChange={(event) => updateWeeklyForm("week", event.target.value)}
                    placeholder="Ej: Semana 32 / Agosto 2026"
                    value={weeklyForm.week}
                  />
                </label>
                <label>
                  <span>Estado del informe</span>
                  <select
                    onChange={(event) => updateWeeklyForm("status", event.target.value as WeeklyReport["status"])}
                    value={weeklyForm.status}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="entregado">Entregado</option>
                    <option value="observado">Observado</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="vencido">Vencido</option>
                    <option value="ajuste">Ajuste solicitado</option>
                    <option value="escalado">Escalado a direccion</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Resumen ejecutivo de gestion</span>
                <textarea
                  onChange={(event) => updateWeeklyForm("progress", event.target.value)}
                  placeholder="Cuenta en pocas lineas que paso esta semana, que se logro y que requiere seguimiento."
                  required
                  rows={4}
                  value={weeklyForm.progress}
                />
              </label>

              <div className="weekly-report-form__grid">
                <label>
                  <span>Tareas finalizadas</span>
                  <textarea
                    onChange={(event) => updateWeeklyForm("completedTasks", event.target.value)}
                    placeholder="Lista entregables cerrados, tramites evacuados, documentos enviados o gestiones terminadas."
                    rows={3}
                    value={weeklyForm.completedTasks}
                  />
                </label>
                <label>
                  <span>Tareas pendientes</span>
                  <textarea
                    onChange={(event) => updateWeeklyForm("pendingTasks", event.target.value)}
                    placeholder="Indica pendientes, responsables, bloqueos o fechas esperadas de cierre."
                    rows={3}
                    value={weeklyForm.pendingTasks}
                  />
                </label>
              </div>

              <div className="evidence-upload-card">
                <div>
                  <span>Evidencias y soportes</span>
                  <p>En esta fase se registran nombres de archivo y enlaces. En produccion se almacenaran en Drive, Supabase Storage o repositorio documental.</p>
                </div>
                <label className="upload-button">
                  <Upload aria-hidden="true" size={16} />
                  Subir archivos
                  <input
                    multiple
                    onChange={(event) => updateEvidenceFiles(event.target.files)}
                    type="file"
                  />
                </label>
              </div>

              {weeklyForm.evidenceFiles.length > 0 ? (
                <ul className="evidence-file-list">
                  {weeklyForm.evidenceFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              ) : null}

              <label>
                <span>Enlace de evidencia</span>
                <input
                  onChange={(event) => updateWeeklyForm("evidenceUrl", event.target.value)}
                  placeholder="Link de Drive, OneDrive, carpeta, acta, informe o soporte"
                  type="url"
                  value={weeklyForm.evidenceUrl}
                />
              </label>

              <div className="weekly-report-form__grid weekly-report-form__grid--thirds">
                <label>
                  <span>Tipo de riesgo</span>
                  <select
                    onChange={(event) => updateWeeklyForm("riskType", event.target.value)}
                    value={weeklyForm.riskType}
                  >
                    <option value="operativo">Operativo</option>
                    <option value="documental">Documental</option>
                    <option value="financiero">Financiero</option>
                    <option value="legal-laboral">Legal / laboral</option>
                    <option value="tributario">Tributario / DIAN</option>
                    <option value="cumplimiento">Cumplimiento / SAGRILAFT</option>
                    <option value="reputacional">Reputacional</option>
                  </select>
                </label>
                <label>
                  <span>Nivel de prioridad</span>
                  <select
                    onChange={(event) => updateWeeklyForm("priority", event.target.value)}
                    value={weeklyForm.priority}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </select>
                </label>
                <label>
                  <span>Fecha limite de aprobacion</span>
                  <input
                    onChange={(event) => updateWeeklyForm("approvalDeadline", event.target.value)}
                    type="date"
                    value={weeklyForm.approvalDeadline}
                  />
                </label>
              </div>

              <label>
                <span>Descripcion de alerta</span>
                <textarea
                  onChange={(event) => updateWeeklyForm("risks", event.target.value)}
                  placeholder="Ej: falta soporte del cliente, vencimiento DIAN, inconsistencia documental, aprobacion pendiente, riesgo laboral o bloqueo operativo."
                  rows={3}
                  value={weeklyForm.risks}
                />
              </label>

              <div className="weekly-report-form__grid">
                <label>
                  <span>Aprobacion o decision requerida</span>
                  <textarea
                    onChange={(event) => updateWeeklyForm("decisions", event.target.value)}
                    placeholder="Describe que debe aprobar o decidir direccion, gerencia o asistencia para que el cargo pueda avanzar."
                    rows={3}
                    value={weeklyForm.decisions}
                  />
                </label>
                <label>
                  <span>Quien aprueba o decide</span>
                  <input
                    onChange={(event) => updateWeeklyForm("decisionOwner", event.target.value)}
                    placeholder="Direccion, gerencia inmediata, cliente, comite, juridica..."
                    value={weeklyForm.decisionOwner}
                  />
                </label>
              </div>

              <label>
                <span>Plan siguiente semana</span>
                <textarea
                  onChange={(event) => updateWeeklyForm("nextActions", event.target.value)}
                  placeholder="Tres acciones prioritarias, responsable por accion y fecha estimada."
                  rows={3}
                  value={weeklyForm.nextActions}
                />
              </label>

              <div className="weekly-report-form__footer">
                <p>
                  {reportNotice || "El registro queda guardado localmente en este prototipo. Luego alimentara dashboard, semaforos y alertas."}
                  {rocketChatNotice ? <span className="rocket-chat-notice">{rocketChatNotice}</span> : null}
                </p>
                <button className="export-button export-button--accent" type="submit">
                  <FileText aria-hidden="true" size={15} />
                  Guardar informe
                </button>
              </div>
            </form>
                  ) : (
                    <div className="access-restricted-panel access-restricted-panel--compact">
                      <p className="eyebrow">Registro restringido</p>
                      <h3>Este perfil no registra informes de gestion operativos.</h3>
                      <p>Direccion revisa y gobierna la informacion. Los responsables y gerencias alimentan el sistema desde sus cargos asignados.</p>
                    </div>
                  )
                ) : null}

                <section className="report-history" aria-label="Historial de informes semanales">
                  <div className="report-history__header">
                    <div>
                      <p className="eyebrow">Gestion de informes</p>
                      <h4>Historial de informes</h4>
                    </div>
                    <small>{selectedReports.length > 0 ? "Direccion y gerencia pueden abrir cada registro." : "Aun no hay registros para este cargo."}</small>
                  </div>

                  {selectedReports.length > 0 ? (
                    <div className="report-history__list">
                      {selectedReports.map((report) => (
                        <button
                          className={openReport?.id === report.id ? "report-history__item report-history__item--active" : "report-history__item"}
                          key={report.id}
                          onClick={() => {
                            setOpenReportId(report.id);
                            setReviewComment(report.reviewComment ?? "");
                          }}
                          type="button"
                        >
                          <span>
                            <strong>{report.week}</strong>
                            <small>{report.operationalFrontName ? `${report.roleTitle} / ${report.operationalFrontName}` : report.roleTitle}</small>
                          </span>
                          <em>{report.reviewStatus === "sin_revision" || !report.reviewStatus ? reportStatusLabels[report.status] : reviewActionLabels[report.reviewStatus]}</em>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="report-history__empty">Cuando el responsable guarde su primer informe de gestion, aparecera aqui para revision.</p>
                  )}

                  {openReport ? (
                    <section className="report-reader" aria-label="Informe semanal abierto">
                      <div className="report-reader__header">
                        <div>
                          <p className="eyebrow">Informe abierto</p>
                          <h4>{openReport.week}</h4>
                          <span>
                            {openReport.roleTitle} / {openReport.responsibleName}
                            {openReport.operationalFrontName ? ` / ${openReport.operationalFrontName}` : ""}
                          </span>
                        </div>
                        <div className="report-reader__header-actions">
                          <strong className="report-reader__status">
                            {reportStatusLabels[openReport.status]}
                          </strong>
                          <button className="report-reader__close" onClick={() => setOpenReportId(null)} type="button">Cerrar</button>
                        </div>
                      </div>

                      <div className="report-reader__meta">
                        <span>Riesgo: {openReport.riskType ?? "No clasificado"}</span>
                        {openReport.operationalFrontName ? <span>Frente: {openReport.operationalFrontName}</span> : null}
                        <span>Prioridad: {openReport.priority ?? openReport.urgency ?? "Media"}</span>
                        <span>Aprueba: {openReport.decisionOwner ?? "Gerencia inmediata"}</span>
                        <span>Fecha limite: {openReport.approvalDeadline ?? openReport.decisionDeadline ?? "Sin fecha"}</span>
                      </div>

                      <div className="report-reader__sections">
                        <article><h5>Resumen ejecutivo</h5><p>{openReport.progress || "Sin resumen registrado."}</p></article>
                        <article><h5>Tareas finalizadas</h5><p>{openReport.completedTasks || "Sin tareas finalizadas registradas."}</p></article>
                        <article><h5>Tareas pendientes</h5><p>{openReport.pendingTasks || "Sin pendientes registrados."}</p></article>
                        <article><h5>Alerta o riesgo</h5><p>{openReport.risks || "Sin alertas registradas."}</p></article>
                        <article><h5>Aprobacion o decision requerida</h5><p>{openReport.decisions || "No requiere aprobacion en este registro."}</p></article>
                        <article><h5>Plan siguiente semana</h5><p>{openReport.nextActions || "Sin plan registrado."}</p></article>
                      </div>

                      {(openReport.evidenceFiles?.length ?? 0) > 0 || openReport.evidenceUrl ? (
                        <div className="report-reader__evidence">
                          <h5>Evidencias</h5>
                          {openReport.evidenceUrl ? <a href={openReport.evidenceUrl} rel="noreferrer" target="_blank">Abrir enlace de evidencia</a> : null}
                          {(openReport.evidenceFiles?.length ?? 0) > 0 ? (
                            <ul>{openReport.evidenceFiles?.map((file) => <li key={file}>{file}</li>)}</ul>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="report-review-box">
                        <div className="report-review-box__header">
                          <div>
                            <p className="eyebrow">Gobierno del informe</p>
                            <h5>Revision y decision</h5>
                          </div>
                          <span>{openReport.reviewStatus ? reviewActionLabels[openReport.reviewStatus] : "Sin revision"}</span>
                        </div>

                        {openReport.reviewedAt || openReport.reviewComment ? (
                          <div className="report-review-box__trace">
                            <strong>Ultima revision</strong>
                            <p>{openReport.reviewComment || "Revision registrada sin comentario adicional."}</p>
                            {openReport.reviewedAt ? <small>{new Date(openReport.reviewedAt).toLocaleString("es-CO")}</small> : null}
                          </div>
                        ) : null}

                        <label>
                          <span>Comentario de revision</span>
                          <textarea
                            onChange={(event) => setReviewComment(event.target.value)}
                            placeholder="Direccion o gerencia puede aprobar, observar, solicitar ajustes o escalar el informe con trazabilidad."
                            rows={3}
                            value={reviewComment}
                          />
                        </label>
                        {canReviewPulses ? (
                          <div className="report-review-box__actions">
                            <button className="report-review-box__button report-review-box__button--observe" onClick={() => reviewWeeklyReport(openReport.id, "observado")} type="button">Observar</button>
                            <button className="report-review-box__button report-review-box__button--adjust" onClick={() => reviewWeeklyReport(openReport.id, "ajuste")} type="button">Solicitar ajuste</button>
                            <button className="report-review-box__button report-review-box__button--escalate" onClick={() => reviewWeeklyReport(openReport.id, "escalado")} type="button">Escalar</button>
                            <button className="report-review-box__button report-review-box__button--approve" onClick={() => reviewWeeklyReport(openReport.id, "aprobado")} type="button">Aprobar</button>
                          </div>
                        ) : (
                          <div className="report-review-box__locked">
                            <ShieldCheck aria-hidden="true" size={17} />
                            <span>Este perfil puede consultar el estado del informe, pero no puede aprobar, observar, solicitar ajustes ni escalar decisiones.</span>
                          </div>
                        )}
                      </div>
                    </section>
                  ) : selectedReports.length > 0 ? (
                    <p className="report-history__empty report-history__empty--hint">Selecciona un informe del historial para abrirlo, revisarlo o cerrarlo.</p>
                  ) : null}
                </section>
              </>
            ) : null}
          </section>

        </aside>
      </section>

      <section className="standards-band standards-band--conecta conecta-method-poster" id="estandar">
        <div className="method-poster-hero">
          <Image alt="" fill sizes="(max-width: 900px) 100vw, 1180px" src="/method/metodo-conecta-nevado.png" />
          <div className="method-poster-hero__copy">
            <p className="eyebrow">Método Conecta</p>
            <h2>
              6 acciones para <strong>comprender el sistema</strong> antes de exigirle resultados.
            </h2>
            <p>
              Convertimos cargos, evidencias, decisiones, riesgos y ritmos de gestion en una lectura viva para actuar con claridad.
            </p>
          </div>
        </div>

        <div className="method-poster-actions" aria-label="Acciones del metodo Conecta">
          {[
            ["Contexto", "Entender la empresa real, sus tensiones, prioridades y cultura antes de cargar tareas."],
            ["Diagnostico", "Mapear cargos, responsables, documentos, evidencias y puntos de friccion del sistema."],
            ["Trazabilidad", "Hacer visible cada avance, alerta, decision y soporte desde el perfil del cargo."],
            ["Informe", "Registrar informes de gestion con estados, riesgos, evidencias y decisiones requeridas."],
            ["Gobierno", "Permitir que direccion y gerencias revisen el sistema sin perder foco ni humanidad."],
            ["Evolucion", "Acompanar aprendizajes, ajustes y nuevos habitos hasta que la gestion respire mejor."]
          ].map(([title, text], index) => (
            <article key={title}>
              <span>{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>    </main>
  );
}













































































































