"use client";

import {
  LayoutDashboard,
  Wallet,
  Building2,
  History,
  Compass,
  Sparkles,
} from "lucide-react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Explore", href: "/dashboard/explore", icon: Compass },
  { label: "Investments", href: "/dashboard/empreendimentos", icon: Building2 },
  { label: "My tokens", href: "/dashboard/cotas", icon: Wallet },
  { label: "Yield history", href: "/dashboard/yields", icon: History },
  {
    label: "Test on devnet",
    href: "/dashboard/devnet",
    icon: Sparkles,
    badge: "BETA",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["investor"]}>
      <DashboardShell
        navItems={NAV}
        title="Investor Dashboard"
        subtitle="Track your investments, token balances and USDC yields."
        variant="investor"
      >
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
