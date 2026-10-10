import type { Metadata } from "next";
import { MemoryDemoExperience } from "@/components/memory/MemoryDemoExperience";

export const metadata: Metadata = { title: "Memoria Viva | CONECTA", description: "Experiencia demostrativa de conocimiento institucional trazable." };

export default function MemoryPage() {
  return <MemoryDemoExperience />;
}
