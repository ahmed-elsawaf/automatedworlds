"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ModeToggle";
import {
  LayoutDashboard,
  Lightbulb,
  ShoppingBag,
  Wrench,
  Users,
  Star,
  Tag,
  BarChart3,
  FolderOpen,
  Settings,
  Link2,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Ideas", href: "/admin/ideas", icon: Lightbulb },
      { label: "Categories", href: "/admin/categories", icon: FolderOpen },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Customizations", href: "/admin/customizations", icon: Wrench },
      { label: "Discounts", href: "/admin/discounts", icon: Tag },
      { label: "Affiliates", href: "/admin/affiliates", icon: Link2 },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Admin Sidebar — darker accent */}
      <aside
        className={cn(
          "flex flex-col shrink-0 border-r border-border/60 transition-all duration-300 relative",
          "bg-[oklch(0.08_0.014_265)]",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo + Admin label */}
        <div className="h-14 flex items-center px-3 border-b border-white/8 shrink-0 gap-2.5">
          <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-xs text-white leading-none">
                AutomatedWorlds
              </p>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-0.5">
                Admin
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-2.5 mb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-primary/20 text-primary"
                          : "text-white/50 hover:text-white/90 hover:bg-white/6"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* View site link */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-white/8">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 text-xs text-white/35 hover:text-white/70 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <ExternalLink className="w-3 h-3" />
              View Site
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
        <header className="h-14 flex items-center gap-3 px-5 border-b border-border/60 bg-background/95 nav-blur shrink-0">
          <div className="flex-1" />
          <ModeToggle />
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
