import { GitCommit, Tag, Calendar, ChevronRight, Zap, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "See what's new and improved in AutomatedWorlds. Track our progress as we build the best SaaS marketplace.",
};

const UPDATES = [
  {
    version: "1.2.0",
    date: "April 25, 2026",
    title: "Gumroad Integration & Premium UI",
    items: [
      { type: "added", text: "Direct Gumroad product linking for instant purchases." },
      { type: "improved", text: "Enhanced Idea Detail pages with high-fidelity Amazon-style galleries." },
      { type: "fixed", text: "Resolved TypeScript errors in the admin creation workflow." },
      { type: "added", text: "New marketing and legal pages for production readiness." }
    ]
  },
  {
    version: "1.1.0",
    date: "April 18, 2026",
    title: "AI Scraper & Categorization",
    items: [
      { type: "added", text: "AI-powered URL scraper to auto-generate idea details from any SaaS website." },
      { type: "improved", text: "Advanced filtering by difficulty and ROI potential." },
      { type: "added", text: "Category icons and better taxonomy management." }
    ]
  },
  {
    version: "1.0.0",
    date: "April 10, 2026",
    title: "Official Launch",
    items: [
      { type: "added", text: "Initial release of AutomatedWorlds marketplace." },
      { type: "added", text: "Core browsing and searching functionality." },
      { type: "added", text: "Admin dashboard for idea curation." },
      { type: "added", text: "User saved ideas and purchase history." }
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Changelog</h1>
        <p className="text-muted-foreground text-lg">
          Stay up to date with the latest features, improvements, and fixes to the AutomatedWorlds platform.
        </p>
      </div>

      <div className="relative space-y-16 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border/60 before:to-transparent">
        {UPDATES.map((update, i) => (
          <div key={update.version} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/20 transition-colors shadow-sm">
              <div className="flex items-center justify-between space-x-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">{update.version}</Badge>
                  <div className="font-bold text-foreground">{update.title}</div>
                </div>
                <time className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {update.date}
                </time>
              </div>
              <ul className="space-y-3 mt-4">
                {update.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 shrink-0">
                      {item.type === "added" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {item.type === "improved" && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      {item.type === "fixed" && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </span>
                    <p>
                      <span className={cn(
                        "font-bold uppercase text-[9px] mr-2",
                        item.type === "added" && "text-emerald-500",
                        item.type === "improved" && "text-blue-500",
                        item.type === "fixed" && "text-amber-500"
                      )}>
                        {item.type}
                      </span>
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 rounded-4xl border border-border/60 bg-muted/20 text-center">
        <h3 className="font-bold mb-2">Have a feature request?</h3>
        <p className="text-sm text-muted-foreground mb-6">We're always looking for ways to make AutomatedWorlds better for you.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/contact">Send us a message</Link>
        </Button>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import Link from "next/link";
