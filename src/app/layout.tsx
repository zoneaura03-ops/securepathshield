import type { Metadata, Viewport } from "next";
import { NavigationLoader } from "../components/navigation-loader";
import { IdleSessionGuard } from "../components/idle-session-guard";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "SecurePath Bank", template: "%s | SecurePath Bank" },
  description: "Credible, innovative and secured banking.",
  applicationName: "SecurePath Bank",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "SecurePath Bank",
    description: "Secure digital banking for individuals and businesses.",
    type: "website",
    images: ["/images/securepathbank-corporate-hero-v2.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SecurePath Bank",
    description: "Secure digital banking for individuals and businesses.",
    images: ["/images/securepathbank-corporate-hero-v2.png"],
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10233f",
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
