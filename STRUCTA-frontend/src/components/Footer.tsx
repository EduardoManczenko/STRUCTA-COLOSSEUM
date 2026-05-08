import { StructaLogo, StructaWordmark } from "./ui/StructaLogo";

const SECTIONS = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Yields", href: "#yields" },
      { label: "Vault", href: "#vault" },
      { label: "Live Deal", href: "#partner" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { label: "Audits", href: "#" },
      { label: "Terms of use", href: "#" },
      { label: "Privacy policy", href: "#" },
      { label: "Geo-restriction", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Whitepaper", href: "#" },
      { label: "API & SDK", href: "#" },
      { label: "Brand Manual", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-dark-700 bg-dark-950 px-5 py-16 sm:px-8 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <StructaLogo className="size-10" />
              <StructaWordmark />
            </div>
            <p className="max-w-xs text-[13px] leading-[1.65] text-gray-500">
              Real estate credit tokenization on Solana. Real yield,
              backed by construction, paid in USDC.
            </p>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-600">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Mainnet soon · Devnet active
            </div>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-orange-500">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-dark-700 pt-8 md:flex-row md:items-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-600">
            © 2026 STRUCTA · v1.0.0
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600">
            <span>Solana · USDC</span>
            <span>·</span>
            <span>Powered by SPL</span>
            <span>·</span>
            <span>Made in Brazil 🇧🇷</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
