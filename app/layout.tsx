import type { Metadata, Viewport } from "next";
import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import LiveTicker from "@/components/layout/LiveTicker";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "PSX Dashboard — Pakistan Stock Exchange Live",
  description: "Real-time Pakistan Stock Exchange dashboard with live prices, fundamental & technical analysis, FIPI/LIPI, news, and AI-powered investment recommendations for all 550+ PSX listed stocks.",
  keywords: ["PSX", "Pakistan Stock Exchange", "KSE", "KSE-100", "stocks", "shares", "live prices", "FIPI", "LIPI"],
  authors: [{ name: "PSX Dashboard" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PSX Dashboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070B14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Fixed Top Navigation */}
        <TopNav />

        {/* Live Ticker — fixed below top nav */}
        <div style={{
          position: 'fixed',
          top: 'var(--nav-height)',
          left: 0,
          right: 0,
          zIndex: 90,
        }}>
          <LiveTicker />
        </div>

        {/* Main Content */}
        <main className="page-container">
          {children}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
