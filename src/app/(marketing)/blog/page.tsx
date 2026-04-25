import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stay ahead in the SaaS game with our latest strategy guides, market research, and technical insights.",
};

const POSTS = [
  {
    title: "How to Launch a SaaS in Under 24 Hours",
    description: "Learn the exact workflow our top founders use to launch their MVP using AutomatedWorlds source code.",
    date: "April 20, 2026",
    readTime: "5 min read",
    category: "Strategy",
    image: "https://images.unsplash.com/photo-1551288049-bbb6518149ad?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "Why Niche AI Tools are the Next Big Gold Mine",
    description: "Deep dive into the market trends showing why hyper-specific AI solutions are outperforming broad platforms.",
    date: "April 15, 2026",
    readTime: "8 min read",
    category: "Market Research",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60"
  },
  {
    title: "The Solo Founder Stack for 2026",
    description: "Our recommended tools and frameworks for building a profitable one-person business.",
    date: "April 8, 2026",
    readTime: "12 min read",
    category: "Tech Stack",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60"
  }
];

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Insights & Strategy</h1>
          <p className="text-lg text-muted-foreground">
            Tips, guides, and market analysis to help you build and scale your next SaaS business.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>New posts every Tuesday</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {POSTS.map((post, i) => (
          <article key={i} className="group flex flex-col rounded-[2rem] border border-border/60 bg-card overflow-hidden hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5">
            <div className="aspect-video relative overflow-hidden">
               <img 
                 src={post.image} 
                 alt={post.title} 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
               />
               <div className="absolute top-4 left-4">
                 <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                   {post.category}
                 </span>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                {post.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                {post.description}
              </p>
              <Button asChild variant="ghost" className="w-fit p-0 h-auto hover:bg-transparent text-primary hover:text-primary/80 gap-2 font-semibold">
                <Link href={`/blog/${post.title.toLowerCase().replace(/ /g, "-")}`}>
                  Read Full Post <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-24 rounded-[3rem] border border-border/60 bg-primary/5 p-8 sm:p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Subscribe to the Insight List</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Get our best SaaS opportunities and marketing deep-dives delivered straight to your inbox. 
          No spam, just signal.
        </p>
        <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
          <input 
            type="email" 
            placeholder="your@email.com" 
            className="flex-1 h-12 rounded-xl border border-border/60 bg-background px-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
          <Button className="h-12 rounded-xl px-8 brand-gradient border-0 text-white font-bold">
            Subscribe
          </Button>
        </form>
      </div>
    </div>
  );
}
