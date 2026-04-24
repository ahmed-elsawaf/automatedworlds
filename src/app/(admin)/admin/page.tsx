"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, ShoppingBag, Wrench, Users, Star, DollarSign,
  TrendingUp, ArrowRight, AlertCircle, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { api } from "../../../../convex/_generated/api";

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KPICard({
  label, value, sub, icon: Icon, trend, href, alert,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: string; href?: string; alert?: boolean;
}) {
  const inner = (
    <div className={cn(
      "p-5 rounded-2xl border bg-card flex flex-col gap-3 transition-all duration-150",
      alert ? "border-amber-500/30 bg-amber-500/5" : "border-border/60",
      href && "hover:border-primary/40 cursor-pointer"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          alert ? "bg-amber-500/15" : "bg-primary/10"
        )}>
          <Icon className={cn("w-4 h-4", alert ? "text-amber-500" : "text-primary")} />
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {trend && <p className="text-xs text-emerald-500 font-medium">{trend}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Chart tooltip ──────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold">${(payload[0].value / 100).toFixed(0)}</p>
    </div>
  );
}

const PIE_COLORS = ["oklch(0.65 0.24 292)", "oklch(0.73 0.17 201)", "oklch(0.72 0.22 32)"];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const revenue = useQuery(api.orders.getRevenueSummary, { days: 30 });

  const revenueByDay = revenue
    ? Object.entries(revenue.byDay)
        .map(([date, cents]) => ({ date: date.slice(5), rev: cents }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const revenueByType = revenue
    ? Object.entries(revenue.byType).map(([type, cents], i) => ({
        name: type.replace(/_/g, " "),
        value: cents,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }))
    : [];

  const isLoading = stats === undefined || revenue === undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform overview — last 30 days</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Action Required */}
          {(stats.actionRequired.pendingCustomizations > 0 || stats.actionRequired.pendingReviews > 0) && (
            <div className="flex flex-wrap gap-3">
              {stats.actionRequired.pendingCustomizations > 0 && (
                <Link
                  href="/admin/customizations"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 text-sm font-medium text-amber-500 hover:bg-amber-500/12 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  {stats.actionRequired.pendingCustomizations} customization{stats.actionRequired.pendingCustomizations !== 1 ? "s" : ""} need review
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              {stats.actionRequired.pendingReviews > 0 && (
                <Link
                  href="/admin/reviews"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/8 text-sm font-medium text-blue-400 hover:bg-blue-500/12 transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  {stats.actionRequired.pendingReviews} review{stats.actionRequired.pendingReviews !== 1 ? "s" : ""} awaiting approval
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Revenue (30d)"
              value={`$${(stats.revenue.last30DaysCents / 100).toFixed(0)}`}
              sub={`${stats.revenue.orderCount30} orders`}
              icon={DollarSign}
              trend={`+$${(stats.revenue.last7DaysCents / 100).toFixed(0)} this week`}
            />
            <KPICard
              label="Total Users"
              value={stats.users.total}
              sub={`${stats.users.newLast30Days} new this month`}
              icon={Users}
              href="/admin/users"
            />
            <KPICard
              label="Published Ideas"
              value={stats.ideas.published}
              sub={`${stats.ideas.drafts} drafts`}
              icon={Lightbulb}
              href="/admin/ideas"
            />
            <KPICard
              label="Paid Users"
              value={stats.users.paidUsers}
              sub="On a paid plan"
              icon={TrendingUp}
              href="/admin/users"
            />
            <KPICard
              label="Total Orders"
              value={stats.revenue.orderCount30}
              sub="Last 30 days"
              icon={ShoppingBag}
              href="/admin/orders"
            />
            <KPICard
              label="Pending Customizations"
              value={stats.actionRequired.pendingCustomizations}
              sub="Need your attention"
              icon={Wrench}
              href="/admin/customizations"
              alert={stats.actionRequired.pendingCustomizations > 0}
            />
            <KPICard
              label="Pending Reviews"
              value={stats.actionRequired.pendingReviews}
              sub="Awaiting moderation"
              icon={Star}
              href="/admin/reviews"
              alert={stats.actionRequired.pendingReviews > 0}
            />
            <KPICard
              label="Avg Order Value"
              value={`$${(revenue!.averageOrderValueCents / 100).toFixed(0)}`}
              sub="Last 30 days"
              icon={DollarSign}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue over time */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border/60 bg-card">
              <h2 className="font-semibold text-sm mb-5">Revenue (last 30 days)</h2>
              {revenueByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.24 292)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.24 292)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 100}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="rev" stroke="oklch(0.65 0.24 292)" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  No revenue data yet
                </div>
              )}
            </div>

            {/* Revenue by type */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card">
              <h2 className="font-semibold text-sm mb-5">Revenue by Type</h2>
              {revenueByType.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={revenueByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {revenueByType.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1.5">
                    {revenueByType.map((e) => (
                      <div key={e.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.fill }} />
                          <span className="text-muted-foreground capitalize">{e.name}</span>
                        </div>
                        <span className="font-semibold">${(e.value / 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </div>

          {/* Top ideas */}
          {stats.topIdeas.length > 0 && (
            <div className="p-6 rounded-2xl border border-border/60 bg-card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-sm">Top Ideas by Revenue</h2>
                <Button asChild variant="ghost" size="sm" className="text-primary gap-1">
                  <Link href="/admin/ideas">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {stats.topIdeas.map(({ idea, revenueCents }, idx) => (
                  idea && (
                    <Link
                      key={idea._id}
                      href={`/admin/ideas/${idea._id}`}
                      className="flex items-center gap-4 py-2 hover:opacity-80 transition-opacity"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{(idea as any).title}</p>
                        <p className="text-xs text-muted-foreground">{(idea as any).purchaseCount} purchase{(idea as any).purchaseCount !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="font-bold text-sm shrink-0">${(revenueCents / 100).toFixed(0)}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
