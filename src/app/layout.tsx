import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kredal — UAE SME Bank-Readiness",
    template: "%s — Kredal",
  },
  description:
    "Upload your UAE company documents. Kredal shows why a bank may reject your file, what to fix, and generates a bank-ready application pack.",
  openGraph: {
    title: "Kredal — UAE SME Bank-Readiness",
    description:
      "Know why a UAE bank would reject your business account file — before you apply.",
    url: siteUrl,
    siteName: "Kredal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kredal — UAE SME Bank-Readiness",
    description:
      "Know why a UAE bank would reject your business account file — before you apply.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
