"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { cn } from "@/lib/utils";
import { Menu, X, Zap, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Browse Ideas", href: "/browse" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop / Tablet Nav */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "nav-blur bg-background/80 border-b border-border/60 shadow-sm"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:brand-glow transition-all duration-200">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">
              <span className="brand-gradient-text">Automated</span>
              <span>Worlds</span>
            </span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right — Auth + Theme */}
          <div className="flex items-center gap-2 shrink-0">
            <ModeToggle />

            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                        },
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                        Sign in
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                      >
                        Get Started
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </SignUpButton>
                  </>
                )}
              </>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 border-b border-border/60 nav-blur bg-background/90",
            mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isLoaded && !isSignedIn && (
              <div className="pt-2 flex flex-col gap-2 border-t border-border/60 mt-2">
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full">Get Started</Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spacer so content clears the fixed nav */}
      <div className="h-16" />
    </>
  );
}
