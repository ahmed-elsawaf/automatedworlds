"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, DollarSign, Layout, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function AdminNewIdeaPage() {
  const router = useRouter();
  const createIdea = useMutation(api.ideas.createIdea);
  const generateIdeaFromUrl = useAction(api.ai.generateIdeaFromUrl);
  const categories = useQuery(api.categories.listCategories, {});
  const generateUploadUrl = useMutation(api.storage.generateIdeaMediaUploadUrl);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [importUrl, setImportUrl] = useState("");
  
  // Form state
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [roiPotential, setRoiPotential] = useState<"low" | "medium" | "high" | "very_high">("high");
  
  // Image state
  const [coverImageId, setCoverImageId] = useState<Id<"_storage"> | undefined>();
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

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
      
      // Local preview
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImageUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
      
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  // Pricing
  const [priceCodeBase, setPriceCodeBase] = useState("99");
  const [priceCustomization, setPriceCustomization] = useState("299");
  const [gumroadUrl, setGumroadUrl] = useState("");

  async function handleGenerate() {
    if (!importUrl.trim()) {
      toast.error("Please enter a URL to import.");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category first.");
      return;
    }
    
    setGenerating(true);
    toast.info("Scraping URL and generating idea... This may take up to 30 seconds.");
    
    try {
      const id = await generateIdeaFromUrl({
        url: importUrl.trim(),
        categoryId: categoryId as Id<"categories">,
        difficulty,
        roiPotential,
      });
      toast.success("Idea generated successfully!");
      router.push(`/admin/ideas/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate idea from URL.");
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    if (!categoryId) {
      toast.error("Please select a category first.");
      return;
    }

    setSaving(true);
    try {
      const id = await createIdea({
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        categoryId: categoryId as Id<"categories">,
        difficulty,
        roiPotential,
        priceCodeBase: priceCodeBase ? parseInt(priceCodeBase) * 100 : 0,
        priceCustomization: priceCustomization ? parseInt(priceCustomization) * 100 : 0,
        coverImageId,
        gumroadProductUrl: gumroadUrl,
      });
      
      toast.success("Idea created successfully");
      router.push(`/admin/ideas/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create idea");
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
            <h1 className="text-3xl font-bold tracking-tight">Create New Idea</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Draft a new SaaS opportunity. You can add content sections later.
            </p>
          </div>
        </div>
      </div>

      {/* AI Import Tool */}
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 overflow-hidden">
        <div className="p-5 border-b border-violet-500/10 bg-violet-500/10 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Globe className="w-4 h-4" /> Import SaaS from URL (AI)
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter a SaaS website URL. Our AI will scrape the site and automatically generate the idea details, pricing, and sections. 
            <strong className="text-foreground ml-1">Make sure to select a Category below first!</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="https://example-saas.com" 
              value={importUrl} 
              onChange={(e) => setImportUrl(e.target.value)} 
              className="rounded-xl flex-1 bg-background"
              disabled={generating || saving}
            />
            <Button 
              type="button" 
              onClick={handleGenerate}
              disabled={generating || saving} 
              className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate via AI"}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-muted-foreground">Keep it catchy and descriptive. The slug will be auto-generated.</p>
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
                  Upload a high-quality thumbnail for your SaaS idea. 
                  This will be shown on the home page and browse grid.
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
              <label className="text-sm font-medium flex items-center gap-1.5">
                Gumroad Product URL
              </label>
              <Input
                placeholder="https://gumroad.com/l/your-product"
                value={gumroadUrl}
                onChange={(e) => setGumroadUrl(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving} className="rounded-xl gap-2 brand-gradient border-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Continue to Details
          </Button>
        </div>
      </form>
    </div>
  );
}
