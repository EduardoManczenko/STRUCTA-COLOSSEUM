"use client";

import {
  LayoutDashboard,
  PlusCircle,
  Building2,
  FileText,
  User,
} from "lucide-react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const NAV = [
  {
    label: "Overview",
    href: "/incorporadora",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "My projects",
    href: "/incorporadora/empreendimentos",
    icon: Building2,
  },
  {
    label: "New project",
    href: "/incorporadora/novo-empreendimento",
    icon: PlusCircle,
  },
  {
    label: "Documents",
    href: "/incorporadora/documentos",
    icon: FileText,
  },
  {
    label: "Company profile",
    href: "/incorporadora/perfil",
    icon: User,
  },
];

export default function IncorporadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard
      allow={["incorporator"]}
      loginHref="/login"
      loginLabel="Developer login"
    >
      <DashboardShell
        navItems={NAV}
        title="Developer Dashboard"
        subtitle="Submit new projects and track your fundraising progress."
        variant="incorporator"
      >
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
