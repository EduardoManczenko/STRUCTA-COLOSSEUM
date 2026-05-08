import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { DevelopmentDetailView } from "./DevelopmentDetailView";
import type { DevelopmentDetail } from "@/lib/types";
import { config } from "@/lib/config";

async function fetchDevelopment(idOrSlug: string): Promise<DevelopmentDetail | null> {
  try {
    const res = await fetch(
      `${config.apiBaseUrl}/public/developments/${encodeURIComponent(idOrSlug)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as DevelopmentDetail;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ idOrSlug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { idOrSlug } = await params;
  const dev = await fetchDevelopment(idOrSlug);
  if (!dev) notFound();

  return (
    <main className="relative min-h-screen bg-dark-900">
      <Navbar />
      <DevelopmentDetailView development={dev} />
      <Footer />
    </main>
  );
}
