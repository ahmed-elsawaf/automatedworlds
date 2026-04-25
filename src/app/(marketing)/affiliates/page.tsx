import { DollarSign, Share2, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: "Join the AutomatedWorlds affiliate program and earn 20% commission on every sale you refer.",
};

export default function AffiliatesPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-emerald-500/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Affiliate Program
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Earn <span className="text-emerald-500">20% Commission</span> for Every Sale
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Partner with AutomatedWorlds and help founders discover their next big idea. 
            Promote premium SaaS concepts and get paid for every purchase made via your link.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-xl px-8 h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 border-0 text-white shadow-lg shadow-emerald-500/20">
              Apply Now
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-semibold">
              Affiliate Login
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-border/60 bg-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold mb-1">20%</p>
            <p className="text-sm text-muted-foreground">Lifetime Commission</p>
          </div>
          <div className="p-8 rounded-3xl border border-border/60 bg-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold mb-1">30 Days</p>
            <p className="text-sm text-muted-foreground">Cookie Duration</p>
          </div>
          <div className="p-8 rounded-3xl border border-border/60 bg-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 mx-auto mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold mb-1">$0</p>
            <p className="text-sm text-muted-foreground">Minimum Payout</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How it Works</h2>
          <p className="text-muted-foreground">Three simple steps to start earning.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mb-6">1</div>
            <h3 className="text-xl font-bold">Sign Up</h3>
            <p className="text-muted-foreground leading-relaxed">
              Create your affiliate account in seconds. We'll provide you with a unique tracking link 
              and access to our marketing assets.
            </p>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mb-6">2</div>
            <h3 className="text-xl font-bold">Share</h3>
            <p className="text-muted-foreground leading-relaxed">
              Promote AutomatedWorlds on your blog, Twitter, newsletter, or YouTube channel. 
              Share specific ideas or the whole platform.
            </p>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mb-6">3</div>
            <h3 className="text-xl font-bold">Get Paid</h3>
            <p className="text-muted-foreground leading-relaxed">
              Receive automatic payouts every month for all successful referrals. 
              Track your earnings in real-time on your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-muted/20 rounded-[3rem] border border-border/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center p-10 sm:p-16">
          <div>
            <h2 className="text-3xl font-bold mb-8">Why Partner with Us?</h2>
            <div className="space-y-6">
              {[
                "High conversion rates for premium SaaS concepts",
                "Instant payouts via Stripe or PayPal",
                "Access to professional banners and copy",
                "Dedicated affiliate support team",
                "Regular updates on high-performing ideas"
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="font-medium">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square max-w-md mx-auto">
             <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10" />
             <div className="w-full h-full rounded-4xl border border-emerald-500/20 bg-card/50 backdrop-blur-xl flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                <Share2 className="w-32 h-32 text-emerald-500/40 absolute -top-10 -right-10 rotate-12" />
                <TrendingUp className="w-24 h-24 text-emerald-500/40 absolute -bottom-10 -left-10 -rotate-12" />
                <div className="text-center">
                   <p className="text-6xl font-black text-emerald-500 mb-2">20%</p>
                   <p className="font-bold text-xl uppercase tracking-widest opacity-60">Revenue Share</p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
