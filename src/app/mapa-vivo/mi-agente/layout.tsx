import type { ReactNode } from "react";
import { ConectaNavigation } from "@/components/ConectaNavigation";

export default function AgentLayout({ children }: { children: ReactNode }) {
  return <main className="org-shell">
    <header className="org-hero org-hero--institutional"><ConectaNavigation /></header>
    <div className="agent-workspace">{children}</div>
  </main>;
}
