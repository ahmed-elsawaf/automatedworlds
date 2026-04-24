"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, ShieldCheck, History } from "lucide-react";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BillingPage() {
  const me = useQuery(api.users.getMe);
  const orders = useQuery(api.orders.getMyOrders, {
    paginationOpts: { numItems: 5, cursor: null },
  });

  if (me === undefined || orders === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Billing & Payments</h1>
          <p className="text-muted-foreground text-sm">Loading billing details...</p>
        </div>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Billing & Payments</h1>
        <p className="text-muted-foreground text-sm">
          Manage your payment methods, billing history, and receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - Polar Portal */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border/60 bg-card">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Customer Portal</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              AutomatedWorlds uses Polar as our merchant of record. Access your secure customer portal to update payment methods, download invoices, and manage your billing details.
            </p>
            <Button asChild className="rounded-xl gap-2 brand-gradient border-0 hover:opacity-90">
              {/* Note: This would typically point to an API route that redirects to the Polar portal session */}
              <a href="https://polar.sh" target="_blank" rel="noopener noreferrer">
                Open Billing Portal <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Secure Payment */}
          <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-500 text-sm mb-1">Secure Payments</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All transactions are encrypted and processed securely by Polar (Stripe). We never store your credit card information on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col - Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl border border-border/60 bg-card">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-widest text-muted-foreground">Account Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Purchases</p>
                <p className="text-2xl font-bold">{me?.totalPurchases ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lifetime Spent</p>
                <p className="text-2xl font-bold">{fmt(me?.totalSpent ?? 0)}</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
              <History className="w-4 h-4" /> Recent Charges
            </div>
            {orders.page.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent charges.</p>
            ) : (
              <div className="space-y-3">
                {orders.page.map((o) => (
                  <div key={o._id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{o.type.replace(/_/g, " ")}</span>
                    <span className="font-medium">{fmt(o.amountTotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
