"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  Inbox,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminWalletPill } from "@/components/admin/AdminWalletPill";
import { AdminAuthorityBanner } from "@/components/admin/AdminAuthorityBanner";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Projects", href: "/admin/empreendimentos", icon: Building2 },
  {
    label: "Pending approvals",
    href: "/admin/aprovacoes",
    icon: Inbox,
  },
  { label: "Developers", href: "/admin/incorporadoras", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <RoleGuard
      allow={["admin"]}
      loginHref="/admin/login"
    >
      <DashboardShell
        navItems={NAV}
        title="Admin Panel"
        subtitle="Review developer proposals, manage projects and on-chain operations."
        variant="admin"
        rightSlot={<AdminWalletPill />}
      >
        <div className="mb-4">
          <AdminAuthorityBanner />
        </div>
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
