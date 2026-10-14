import type { Metadata } from "next";
import { MemoryDemoExperience } from "@/components/memory/MemoryDemoExperience";
import orgData from "@/data/grupo-ac-org.json";
import { projectOrganizationalUnits } from "@/lib/conecta/organizational-catalog";

const organizationalUnits = projectOrganizationalUnits(orgData.nodes);

export const metadata: Metadata = { title: "Memoria Viva | CONECTA", description: "Experiencia demostrativa de conocimiento institucional trazable." };

export default function MemoryPage() {
  return <MemoryDemoExperience organizationalUnits={organizationalUnits} />;
}
