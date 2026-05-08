"use client";

const ITEMS = [
  "SOLANA",
  "·",
  "USDC",
  "·",
  "SPL TOKEN",
  "·",
  "CHAINALYSIS KYT",
  "·",
  "ASSET RING-FENCING",
  "·",
  "COMPLETION INSURANCE",
  "·",
  "AUDITED CONTRACTS",
  "·",
  "SPE",
  "·",
];

export function TrustStrip() {
  const all = [...ITEMS, ...ITEMS];
  return (
    <section
      aria-label="Technologies and partners"
      className="relative border-y border-dark-700 bg-dark-950/40 py-7 overflow-hidden"
    >
      {/* fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-dark-900 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-dark-900 to-transparent" />

      <div className="flex animate-marquee whitespace-nowrap will-change-transform">
        {all.map((item, idx) => (
          <span
            key={idx}
            className={`mx-6 font-mono text-[12px] uppercase tracking-[0.3em] ${
              item === "·" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
