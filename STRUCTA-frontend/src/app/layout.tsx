import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const inter = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
      style: "normal",
    },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});


const spaceMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/space-mono/files/space-mono-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-space-mono",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "STRUCTA — Real Yield Backed by Real Estate · USDC · Solana",
  description:
    "The first Brazilian real estate credit tokenization platform on Solana. 16–22% APY in USDC, backed by real developments. Structure. Rise. Trust.",
  keywords: [
    "real estate tokenization",
    "RWA",
    "real world assets",
    "Solana",
    "USDC yield",
    "real estate staking",
    "tokenized real estate credit",
    "STRUCTA",
    "DeFi Brazil",
  ],
  authors: [{ name: "STRUCTA" }],
  openGraph: {
    title: "STRUCTA — Real Estate Credit Tokenization",
    description:
      "Real yield, backed by real estate. Paid in USDC. 16–22% APY on Solana.",
    type: "website",
    locale: "en_US",
    siteName: "STRUCTA",
  },
  twitter: {
    card: "summary_large_image",
    title: "STRUCTA — Real Yield Backed by Real Estate",
    description: "Real estate credit tokenization on Solana. 16–22% APY in USDC.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-body bg-dark-900 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
