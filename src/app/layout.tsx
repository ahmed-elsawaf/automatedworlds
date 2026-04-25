import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthIntentProvider } from "@/lib/auth-intent";
import { AuthGateProvider } from "@/components/auth/AuthGateProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://automatedworlds.com"),
  title: {
    default: "AutomatedWorlds — Buy SaaS Ideas, Ready to Launch",
    template: "%s | AutomatedWorlds",
  },
  description:
    "Discover professionally researched SaaS ideas. Every idea comes with full market analysis, live demo, and ready-to-launch source code. Browse, buy, and start making money.",
  keywords: [
    "SaaS ideas",
    "startup ideas",
    "buy source code",
    "SaaS marketplace",
    "MVP code",
    "business opportunities",
    "entrepreneurship",
  ],
  authors: [{ name: "AutomatedWorlds Team" }],
  creator: "AutomatedWorlds",
  publisher: "AutomatedWorlds",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://automatedworlds.com",
    siteName: "AutomatedWorlds",
    title: "AutomatedWorlds — Buy SaaS Ideas, Ready to Launch",
    description: "Launch your next SaaS in minutes with our researched ideas and ready-to-use source code.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AutomatedWorlds — SaaS Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutomatedWorlds — Buy SaaS Ideas",
    description: "Launch your next SaaS in minutes with our researched ideas and ready-to-use source code.",
    creator: "@automatedworlds",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", inter.variable, geistMono.variable)}
    >
      <ClerkProvider>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthIntentProvider>
              <ConvexClientProvider>
                <AuthGateProvider>
                  <TooltipProvider delayDuration={300}>
                    {children}
                    <Toaster position="bottom-right" richColors />
                  </TooltipProvider>
                </AuthGateProvider>
              </ConvexClientProvider>
            </AuthIntentProvider>
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
