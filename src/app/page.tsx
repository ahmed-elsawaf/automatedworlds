"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Target } from "lucide-react";

export default function Home() {
  const ideas = useQuery(api.ideas.list);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover SaaS Ideas</h1>
          <p className="text-muted-foreground mt-1">
            Data-backed SaaS opportunities ready for you to build or buy.
          </p>
        </div>
        <Button>
          Suggest an Idea
        </Button>
      </div>

      {ideas === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted/50 rounded-t-lg" />
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20 border-dashed">
          <h3 className="text-xl font-semibold mb-2">No ideas found</h3>
          <p className="text-muted-foreground">Check back later for new SaaS opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <Card key={idea._id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow border-border/50">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={idea.isIdeaOfTheDay ? "default" : "secondary"}>
                    {idea.isIdeaOfTheDay ? "Idea of the Day" : "Opportunity"}
                  </Badge>
                  <div className="flex items-center text-orange-500 text-sm font-medium">
                    <Flame className="w-4 h-4 mr-1" />
                    {idea.opportunityScore}/10
                  </div>
                </div>
                <CardTitle className="line-clamp-1">{idea.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {idea.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  {idea.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-auto">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Search Vol</p>
                    <p className="font-semibold">{idea.searchVolume.toLocaleString()}/mo</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Difficulty</p>
                    <div className="flex items-center font-medium">
                      <Target className="w-4 h-4 mr-1 text-blue-500" />
                      {idea.executionDifficulty}/10
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/ideas/${idea.slug}`}>
                    View Full Report
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

