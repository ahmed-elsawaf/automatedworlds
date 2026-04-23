import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Navbar } from "@/components/Navbar";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutomatedWorlds - SaaS Ideas",
  description: "Browse SaaS ideas and buy fully built apps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
         <ClerkProvider>
      <body className="min-h-full flex flex-col">
      <TooltipProvider>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
           <ConvexClientProvider>
             <SidebarProvider>
               <AppSidebar />
               <SidebarInset className="flex flex-col flex-1">
                 <Navbar />
                 <main className="flex-1 flex flex-col">
                   {children}
                 </main>
               </SidebarInset>
             </SidebarProvider>
           </ConvexClientProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
         </ClerkProvider>
    </html>
  );
}
