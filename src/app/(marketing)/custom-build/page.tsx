"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { 
  Paintbrush, 
  Zap, 
  ShieldCheck, 
  Globe, 
  MessageSquare, 
  ArrowRight, 
  Rocket, 
  CheckCircle2,
  Code2,
  Palette,
  Terminal,
  Settings,
  Cpu
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Brand Transformation",
    description: "We don't just change a logo. We create a cohesive brand identity including names, color palettes, and typography that resonates with your market.",
    icon: Palette,
    color: "text-pink-400",
    bg: "bg-pink-500/10"
  },
  {
    title: "Custom Features",
    description: "Need that one specific integration or a unique dashboard widget? Our developers will add custom modules specifically for your instance.",
    icon: Code2,
    color: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    title: "Production Deployment",
    description: "We handle the hosting, SSL, domain configuration, and environment variables. You get a production-ready URL on day one.",
    icon: Globe,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    title: "White-Label Delivery",
    description: "All branding and references to AutomatedWorlds are removed. It's your product, your business, your asset. 100%.",
    icon: ShieldCheck,
    color: "text-amber-400",
    bg: "bg-amber-500/10"
  }
];

const STEPS = [
  {
    title: "Select an Idea",
    description: "Choose any SaaS concept from our marketplace that aligns with your vision.",
    icon: Terminal
  },
  {
    title: "Payment & Brief",
    description: "Pay the customization deposit and fill out our detailed requirement wizard.",
    icon: MessageSquare
  },
  {
    title: "Build Phase",
    description: "Our team brands, configures, and customizes the codebase within 5-7 business days.",
    icon: Settings
  },
  {
    title: "Launch",
    description: "Receive your production URL and the full source code for your new business.",
    icon: Rocket
  }
];

export default function CustomBuildPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNav />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.65_0.24_292/0.05),transparent_50%)]" />
          
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3.5 h-3.5" />
              Done-For-You Service
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              You Choose the Idea. <br />
              <span className="brand-gradient-text">We Build the Business.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Skip the technical hurdles. Our team of expert developers will brand, customize, and deploy your chosen SaaS in less than a week.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 rounded-xl brand-gradient border-0 hover:opacity-90 gap-2 font-bold" asChild>
                <Link href="/browse">
                  Browse Ideas to Customize <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl bg-card/50 backdrop-blur-sm" asChild>
                <Link href="#process">See the Workflow</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 border-t border-border/60 bg-muted/20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why choose a Custom Build?</h2>
              <p className="text-muted-foreground">We handle the technical heavy lifting so you can focus on marketing.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-all duration-300">
                  <div className={cn("w-12 h-12 rounded-xl mb-4 flex items-center justify-center", f.bg)}>
                    <f.icon className={cn("w-6 h-6", f.color)} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Process */}
        <section id="process" className="py-24 px-4 relative overflow-hidden">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-bold mb-4">The Launch Workflow</h2>
              <p className="text-muted-foreground">A professional, high-touch process from start to finish.</p>
            </div>

            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border/60 before:to-transparent">
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  {/* Dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing/Entry CTA */}
        <section className="py-24 px-4 bg-muted/30 border-y border-border/60">
          <div className="mx-auto max-w-4xl">
            <div className="relative p-8 sm:p-16 rounded-[2.5rem] bg-card border border-border/60 shadow-2xl overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-4">
                <Crown className="w-12 h-12 text-primary/10 -rotate-12" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 italic">Ready for a professional launch?</h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Custom builds start with a <strong>$499 deposit</strong>. This covers your brand identity package and initial server setup.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  "Complete Brand Identity (Logo + Colors)",
                  "Custom Domain & SSL Setup",
                  "White-Label Codebase Handover",
                  "Priority Email & Chat Support"
                ].map((check) => (
                  <div key={check} className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="h-14 px-12 rounded-2xl brand-gradient text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" asChild>
                <Link href="/browse">
                  Start Your Custom Build
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Crown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
