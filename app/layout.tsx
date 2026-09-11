import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { OfflineBanner } from "@/components/offline-banner";

export const metadata: Metadata = {
  title: "APK Store",
  description: "APK and PWA marketplace",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "APK Store",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        <OfflineBanner />
        <ServiceWorkerRegister />
        <main className="mx-auto max-w-lg pb-24 min-h-dvh">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
