"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { use } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Target, DollarSign, ArrowLeft, ShoppingCart, Code, Rocket } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function IdeaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const idea = useQuery(api.ideas.getBySlug, { slug });

  if (idea === undefined) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-5xl animate-pulse">
        <div className="h-8 w-32 bg-muted rounded mb-8"></div>
        <div className="h-16 w-3/4 bg-muted rounded mb-4"></div>
        <div className="h-6 w-1/2 bg-muted rounded mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (idea === null) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Idea not found</h1>
        <p className="text-muted-foreground mb-8">The SaaS idea you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/">Back to Ideas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Discover
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {idea.isIdeaOfTheDay && (
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  <Flame className="w-3 h-3 mr-1" /> Idea of the Day
                </Badge>
              )}
              {idea.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{idea.title}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {idea.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Search Volume</div>
              <div className="text-2xl font-bold">{idea.searchVolume.toLocaleString()}/mo</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Growth</div>
              <div className="text-2xl font-bold text-green-500">+{idea.growthPercentage}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Potential</div>
              <div className="text-2xl font-bold">{idea.revenuePotential}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Difficulty</div>
              <div className="text-2xl font-bold">{idea.executionDifficulty}/10</div>
            </div>
          </div>

          <Tabs defaultValue="report" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                Full Report
              </TabsTrigger>
              <TabsTrigger value="roast" className="rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:text-destructive data-[state=active]:bg-transparent px-6 py-3">
                AI Roast 🔥
              </TabsTrigger>
            </TabsList>
            <TabsContent value="report" className="pt-6 prose prose-neutral dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: idea.fullReport.replace(/\n/g, '<br/>') }} />
            </TabsContent>
            <TabsContent value="roast" className="pt-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-destructive-foreground">
                <h3 className="text-xl font-bold flex items-center mb-4">
                  <Flame className="w-6 h-6 mr-2 text-destructive" /> 
                  Why this might fail
                </h3>
                <p>
                  1. You are not the only one who saw this idea.<br/><br/>
                  2. Building the tech is 10% of the work; distribution is 90%.<br/><br/>
                  3. If you can't acquire users for less than your LTV, you will burn money fast.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar / CTA Area */}
        <div className="space-y-6 sticky top-24">
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
              <CardTitle className="text-2xl flex items-center">
                <Code className="w-5 h-5 mr-2 text-primary" />
                Buy the MVP
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Skip the build phase. Get the completely built, production-ready codebase for this exact idea.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between font-medium">
                  <span>Price</span>
                  <span className="text-2xl font-bold">$299</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Rocket className="w-4 h-4 mr-2 text-green-500" /> Complete Next.js 16 App Router setup
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Rocket className="w-4 h-4 mr-2 text-green-500" /> Convex Database + Clerk Auth
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Rocket className="w-4 h-4 mr-2 text-green-500" /> Polar Payments integration
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Rocket className="w-4 h-4 mr-2 text-green-500" /> Shadcn UI design system
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full font-bold text-md h-12">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Checkout with Polar
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Idea Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Opportunity</span>
                  <span className="font-medium">{idea.opportunityScore}/10</span>
                </div>
                <Progress value={idea.opportunityScore * 10} className="h-2 bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Problem Severity</span>
                  <span className="font-medium">{idea.problemScore}/10</span>
                </div>
                <Progress value={idea.problemScore * 10} className="h-2 bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Go-to-Market</span>
                  <span className="font-medium">{idea.goToMarketScore}/10</span>
                </div>
                <Progress value={idea.goToMarketScore * 10} className="h-2 bg-muted/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
