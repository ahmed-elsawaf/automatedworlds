"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ModeToggle";
import { NotificationBell } from "./NotificationBell";
import {
  LayoutDashboard,
  ShoppingBag,
  Wrench,
  Bookmark,
  Bell,
  CreditCard,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Customizations", href: "/dashboard/customizations", icon: Wrench },
  { label: "Saved Ideas", href: "/dashboard/saved", icon: Bookmark },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col shrink-0 border-r border-border/60 bg-sidebar transition-all duration-300 relative",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-border/60 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <span className="font-bold text-sm tracking-tight truncate">
                <span className="brand-gradient-text">Automated</span>
                <span>Worlds</span>
              </span>
            )}
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon
                  className={cn("w-4 h-4 shrink-0", active && "text-primary")}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + Browse link */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-border/60 text-xs">
            <Link
              href="/browse"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-2 py-2 rounded-lg hover:bg-sidebar-accent"
            >
              <div className="w-4 h-4 rounded-sm brand-gradient flex items-center justify-center overflow-hidden">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              Browse Ideas
            </Link>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border/60 bg-background/95 nav-blur shrink-0">
          <div className="flex-1" />
          <NotificationBell />
          <ModeToggle />
          <UserButton
            appearance={{ elements: { avatarBox: "w-8 h-8" } }}
          />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
