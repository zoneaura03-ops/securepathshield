import type { Metadata, Viewport } from "next";
import { NavigationLoader } from "../components/navigation-loader";
import { IdleSessionGuard } from "../components/idle-session-guard";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "SecurePath Shield Bank", template: "%s | SecurePath Shield" },
  description: "Credible, innovative and secured banking.",
  applicationName: "SecurePath Shield",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "SecurePath Shield Bank",
    description: "Secure digital banking for individuals and businesses.",
    type: "website",
    images: ["/images/securepathshield-corporate-hero.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SecurePath Shield Bank",
    description: "Secure digital banking for individuals and businesses.",
    images: ["/images/securepathshield-corporate-hero.webp"],
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17233f",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <IdleSessionGuard />
        <NavigationLoader>{children}</NavigationLoader>
      </body>
    </html>
  );
}
