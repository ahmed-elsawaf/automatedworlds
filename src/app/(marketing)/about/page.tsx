import { Rocket, Target, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission behind AutomatedWorlds and how we're helping founders automate their entrepreneurship journey.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Our Mission: <span className="brand-gradient-text">Automating Entrepreneurship</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AutomatedWorlds was built for founders who value speed over everything. 
            We research, build, and document SaaS opportunities so you can launch in minutes, not months.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="p-8 rounded-3xl border border-border/60 bg-card hover:border-primary/40 transition-colors">
            <Zap className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-xl font-bold mb-3">Speed to Market</h3>
            <p className="text-muted-foreground leading-relaxed">
              The biggest risk in SaaS is spending months building something nobody wants. 
              We skip the building phase and get you straight to the validation phase.
            </p>
          </div>
          <div className="p-8 rounded-3xl border border-border/60 bg-card hover:border-cyan-400/40 transition-colors">
            <Target className="w-10 h-10 text-cyan-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Proven Concepts</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every idea on AutomatedWorlds is backed by deep market research, 
              competitor analysis, and a clear revenue model. No fluff.
            </p>
          </div>
          <div className="p-8 rounded-3xl border border-border/60 bg-card hover:border-violet-500/40 transition-colors">
            <Rocket className="w-10 h-10 text-violet-500 mb-6" />
            <h3 className="text-xl font-bold mb-3">Ready to Scale</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our source code is built using modern stacks (Next.js, Tailwind, Convex). 
              It's clean, documented, and ready for you to customize and scale.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <h2 className="text-3xl font-bold">The Story</h2>
        <div className="prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed mx-auto">
          <p>
            AutomatedWorlds started as a side project between two developers who were tired of 
            seeing great domains and ideas gather dust. We realized that the hardest part of 
            SaaS wasn't the code—it was the decision-making and the initial setup.
          </p>
          <p>
            We decided to "productize" the MVP process. By handling the research, the 
            architecture, and the core features, we empower founders to take immediate action 
            on high-potential opportunities.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] brand-gradient p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to skip the "building" phase?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-10">
            Join 500+ founders who have used AutomatedWorlds to launch their next revenue-generating SaaS.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl px-8 h-12 text-base font-semibold">
              <Link href="/browse">Browse Ideas</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 h-12 text-base font-semibold">
              <Link href="/affiliates">Become an Affiliate</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
