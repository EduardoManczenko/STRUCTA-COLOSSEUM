import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { YieldComparison } from "@/components/sections/YieldComparison";
import { Solution } from "@/components/sections/Solution";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LiveDeal } from "@/components/sections/LiveDeal";
import { IncorporatorPartners } from "@/components/sections/IncorporatorPartners";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-dark-900">
      <Navbar />
      <Hero />
      <TrustStrip />
      <YieldComparison />
      <Solution />
      <HowItWorks />
      <LiveDeal />
      <IncorporatorPartners />
      <FinalCTA />
      <Footer />
    </main>
  );
}
