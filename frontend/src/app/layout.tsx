import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flux-Agent | Autonomous P2P Solar Energy Trading — India",
  description:
    "Real peer-to-peer solar energy orchestration using Microsoft AutoGen agents, Sentinel-2 satellite data, PyPSA grid physics, and Llama 3.1 explainable AI. Indian energy market demo (₹/kWh). 100% local & open-source.",
  keywords: ["P2P energy", "solar trading", "AutoGen", "Sentinel-2", "federated learning", "smart grid", "India"],
  openGraph: {
    title: "Project Flux-Agent — P2P Solar Energy Trading",
    description: "Autonomous Peer-to-Peer Energy Orchestration with real AI agents — India AI Summit 2026 Demo",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
