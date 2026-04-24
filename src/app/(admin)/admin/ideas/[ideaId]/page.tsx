"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, DollarSign, Layout, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function AdminEditIdeaPage() {
  const { ideaId } = useParams<{ ideaId: Id<"ideas"> }>();
  const router = useRouter();

  const idea = useQuery(api.ideas.getIdeaById, { ideaId });
  const categories = useQuery(api.categories.listCategories);
  const updateIdea = useMutation(api.ideas.updateIdea);

  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [roiPotential, setRoiPotential] = useState<"low" | "medium" | "high" | "very_high">("high");
  
  // Pricing
  const [priceCodeBase, setPriceCodeBase] = useState("");
  const [priceCustomization, setPriceCustomization] = useState("");
  const [priceExclusive, setPriceExclusive] = useState("");

  // Status flags
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Image upload state
  const [coverImageId, setCoverImageId] = useState<Id<"_storage"> | undefined>();
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.storage.generateIdeaMediaUploadUrl);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setTagline(idea.tagline || "");
      setCategoryId(idea.categoryId || "");
      setDifficulty(idea.difficulty);
      setRoiPotential(idea.roiPotential);
      setPriceCodeBase(idea.priceCodeBase !== undefined ? (idea.priceCodeBase / 100).toString() : "");
      setPriceCustomization(idea.priceCustomization !== undefined ? (idea.priceCustomization / 100).toString() : "");
      setPriceExclusive(idea.priceExclusive !== undefined ? (idea.priceExclusive / 100).toString() : "");
      setIsPublished(idea.isPublished);
      setIsFeatured(idea.isFeatured);
      setCoverImageId(idea.coverImageId);
    }
  }, [idea]);

  // Resolve cover image URL when ID changes
  const resolvedUrl = useQuery(api.storage.getFileUrl, coverImageId ? { fileId: coverImageId } : "skip");
  useEffect(() => {
    if (resolvedUrl) setCoverImageUrl(resolvedUrl);
  }, [resolvedUrl]);

  if (idea === undefined || categories === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Ideas
        </Button>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  if (idea === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Idea not found</h1>
        <p className="text-muted-foreground mb-6">This idea doesn't exist.</p>
        <Button asChild className="rounded-xl"><Link href="/admin/ideas">Go Back</Link></Button>
      </div>
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setCoverImageId(storageId);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      await updateIdea({
        ideaId,
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        categoryId: categoryId ? (categoryId as Id<"categories">) : undefined,
        difficulty,
        roiPotential,
        priceCodeBase: priceCodeBase ? parseInt(priceCodeBase) * 100 : undefined,
        priceCustomization: priceCustomization ? parseInt(priceCustomization) * 100 : undefined,
        priceExclusive: priceExclusive ? parseInt(priceExclusive) * 100 : undefined,
        isPublished,
        isFeatured,
        coverImageId,
      });
      
      toast.success("Idea updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update idea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Ideas
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Details: {idea.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-muted-foreground text-sm font-mono">Slug: {idea.slug}</span>
              {idea.isPublished && (
                <a href={`/ideas/${idea.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 hover:underline">
                  View Live <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="rounded-xl gap-2">
              <Link href={`/admin/ideas/${ideaId}/sections`}>
                <Layout className="w-4 h-4" /> Edit Content
              </Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="rounded-xl gap-2 brand-gradient border-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Status toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsPublished(!isPublished)}
          >
            <div>
              <p className="font-semibold text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" /> Visibility Status
              </p>
              <p className="text-xs text-muted-foreground mt-1">Make this idea visible to the public.</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${isPublished ? "bg-emerald-500" : "bg-muted"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPublished ? "left-6" : "left-1"}`} />
            </div>
          </div>

          <div 
            className="flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsFeatured(!isFeatured)}
          >
            <div>
              <p className="font-semibold text-sm flex items-center gap-2 text-violet-500">
                ⭐ Featured Listing
              </p>
              <p className="text-xs text-muted-foreground mt-1">Highlight this on the homepage.</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${isFeatured ? "bg-violet-500" : "bg-muted"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isFeatured ? "left-6" : "left-1"}`} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/60 bg-muted/20">
            <h2 className="font-semibold text-sm">Basic Information</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Idea Title <span className="text-rose-500">*</span></label>
              <Input 
                required 
                placeholder="e.g. AI-Powered CRM for Dentists" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tagline</label>
              <Textarea 
                placeholder="A one-sentence pitch..." 
                value={tagline} 
                onChange={(e) => setTagline(e.target.value)} 
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select a category...</option>
                  {categories?.map((c) => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Technical Difficulty</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">ROI Potential</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={roiPotential}
                  onChange={(e) => setRoiPotential(e.target.value as any)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Listing Thumbnail</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">16:9 Recommended</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden border border-border/40 bg-muted/30 relative group">
                {coverImageUrl ? (
                  <img src={coverImageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layout className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This image will be used as the primary thumbnail in the marketplace grid and at the top of the listing page. 
                  High-quality, 3D icons or clean software screenshots work best.
                </p>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="rounded-xl gap-2"
                    disabled={uploading}
                    onClick={() => document.getElementById("cover-upload")?.click()}
                  >
                    {uploading ? "Uploading..." : coverImageId ? "Change Image" : "Upload Image"}
                  </Button>
                  {coverImageId && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => { setCoverImageId(undefined); setCoverImageUrl(null); }}
                    >
                      Remove
                    </Button>
                  )}
                  <input 
                    id="cover-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/60 bg-muted/20">
            <h2 className="font-semibold text-sm">Pricing (USD)</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Code Base
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" min="0" 
                  value={priceCodeBase} 
                  onChange={(e) => setPriceCodeBase(e.target.value)} 
                  className="rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5 text-primary">
                Customization
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" min="0" 
                  value={priceCustomization} 
                  onChange={(e) => setPriceCustomization(e.target.value)} 
                  className="rounded-xl pl-9 border-primary/30 focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5 text-violet-500">
                Exclusive Rights
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" min="0" 
                  value={priceExclusive} 
                  onChange={(e) => setPriceExclusive(e.target.value)} 
                  className="rounded-xl pl-9 border-violet-500/30 focus-visible:ring-violet-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
