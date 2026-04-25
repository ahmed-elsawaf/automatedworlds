"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Image as ImageIcon, 
  Copy, 
  Share2, 
  Download, 
  Zap,
  Sparkles,
  Loader2,
  ExternalLink,
  ChevronRight,
  Globe,
  RefreshCw,
  Layout,
  Type
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Idea {
  _id: string;
  title: string;
  tagline: string;
  description?: string;
  problemStatement?: string;
  solutionOverview?: string;
  slug: string;
  coverImageUrl?: string | null;
}

/* ─── Component: Marketing Image Generator (Canvas) ─────────────────────── */
function MarketingImageGenerator({ 
  idea, 
  headline, 
  tagline,
  onImageGenerated
}: { 
  idea?: Idea, 
  headline: string, 
  tagline: string,
  onImageGenerated: (url: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !idea) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#4f46e5"); // Indigo 600
    grad.addColorStop(1, "#06b6d4"); // Cyan 500
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some "abstract" shapes
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.2, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width * 0.1, canvas.height * 0.9, 150, 0, Math.PI * 2);
    ctx.fill();

    // Text Styling
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Title
    ctx.font = "bold 48px Inter, system-ui, sans-serif";
    ctx.fillText(idea.title.toUpperCase(), canvas.width / 2, canvas.height / 2 - 40);

    // Headline (AI Generated)
    ctx.font = "bold 32px Inter, sans-serif";
    ctx.fillText(headline, canvas.width / 2, canvas.height / 2 + 30);

    // Tagline (AI Generated)
    ctx.font = "normal 18px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(tagline, canvas.width / 2, canvas.height / 2 + 80);

    // Branding
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("LAUNCHED BY AUTOMATEDWORLDS.COM", canvas.width / 2, canvas.height - 40);

    // Export
    const url = canvas.toDataURL("image/png");
    onImageGenerated(url);
    toast.success("Marketing image generated!");
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${idea?.title || "post"}-marketing.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="relative group border border-border/40 rounded-2xl overflow-hidden shadow-xl">
        <canvas 
          ref={canvasRef} 
          width={1200} 
          height={630} 
          className="w-full aspect-[1.91/1] bg-muted"
        />
        {!idea && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">Select an idea to generate image</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          className="flex-1 rounded-xl h-11 gap-2" 
          disabled={!idea}
          onClick={generateImage}
        >
          <Sparkles className="w-4 h-4" /> Generate Branding Image
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl h-11 w-11" 
          disabled={!idea}
          onClick={downloadImage}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Component: FB Mockup ──────────────────────────────────────────────── */
function FacebookMockup({ 
  idea, 
  text, 
  customImageUrl 
}: { 
  idea?: Idea, 
  text: string, 
  customImageUrl?: string 
}) {
  const imageUrl = customImageUrl || idea?.coverImageUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80";

  return (
    <Card className="w-full max-w-[500px] bg-white text-black overflow-hidden shadow-sm border-gray-200">
      {/* Header */}
      <div className="p-3 flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-[15px] leading-tight">AutomatedWorlds</p>
          <p className="text-[13px] text-gray-500">Sponsored · <Globe className="inline w-3 h-3" /></p>
        </div>
      </div>

      {/* Post Text */}
      <div className="px-3 pb-3">
        <p className="text-[15px] whitespace-pre-wrap">{text || "Your marketing copy will appear here..."}</p>
      </div>

      {/* Image / Link Preview */}
      <div className="border-t border-b border-gray-100">
        <div className="aspect-[1.91/1] relative bg-gray-100 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-12 h-12 text-gray-300" />
          )}
        </div>
        <div className="p-3 bg-gray-100 border-t border-gray-200">
          <p className="text-[12px] text-gray-500 uppercase tracking-tight">AUTOMATEDWORLDS.COM</p>
          <p className="font-bold text-[16px] truncate">{idea?.title || "SaaS Idea Name"}</p>
          <p className="text-[14px] text-gray-500 truncate">{idea?.tagline || "Tagline goes here"}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
         <div className="flex gap-4">
            <button className="flex items-center gap-1.5 text-gray-600 font-semibold text-[13px]">
              <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><ImageIcon className="w-2.5 h-2.5 text-white" /></div>
              Like
            </button>
            <button className="flex items-center gap-1.5 text-gray-600 font-semibold text-[13px]">Comment</button>
            <button className="flex items-center gap-1.5 text-gray-600 font-semibold text-[13px]">Share</button>
         </div>
      </div>
      
      <div className="p-3 flex items-center justify-between">
         <span className="text-[14px] text-gray-500">Shop now for instant access</span>
         <Button size="sm" className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black border-0 h-8 rounded-lg font-bold text-[13px]">
           Learn More
         </Button>
      </div>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function SocialGenPage() {
  const ideas = useQuery(api.ideas.listIdeas, { 
    paginationOpts: { numItems: 100, cursor: null } 
  });
  const generatePostAction = useAction(api.ai.generateSocialPost);
  
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("");
  const [postText, setPostText] = useState("");
  const [imgHeadline, setImgHeadline] = useState("");
  const [imgTagline, setImgTagline] = useState("");
  const [generating, setGenerating] = useState(false);
  const [customImage, setCustomImage] = useState<string>("");

  const selectedIdea = ideas?.page.find((i: any) => i._id === selectedIdeaId);

  async function handleGenerate() {
    if (!selectedIdeaId) return;
    setGenerating(true);
    try {
      const result = await generatePostAction({ 
        ideaId: selectedIdeaId as any, 
        platform: "facebook" 
      });
      setPostText(result.postText);
      setImgHeadline(result.imageHeadline);
      setImgTagline(result.imageTagline);
      toast.success("AI generated your marketing content!");
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(postText);
    toast.success("Text copied to clipboard!");
  }

  function handleShare() {
    if (!selectedIdea) return;
    const url = `https://automatedworlds.com/ideas/${selectedIdea.slug}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(postText)}`;
    window.open(fbUrl, "_blank");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Post Generator</h1>
          <p className="text-muted-foreground">AI-powered marketing for your SaaS ideas.</p>
        </div>
        <div className="flex items-center gap-2">
           <select 
             className="bg-card border border-border/60 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-w-[240px]"
             value={selectedIdeaId}
             onChange={(e) => setSelectedIdeaId(e.target.value)}
           >
             <option value="">Select an idea...</option>
             {ideas?.page.map((i) => (
               <option key={i._id} value={i._id}>{i.title}</option>
             ))}
           </select>
           <Button 
             className="rounded-xl gap-2 brand-gradient border-0 text-white font-bold" 
             disabled={!selectedIdeaId || generating}
             onClick={handleGenerate}
           >
             {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
             {postText ? "Regenerate AI" : "Generate with AI"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Editor & Tools */}
        <div className="space-y-6">
          <Card className="p-6 border-border/60 bg-card/50 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" /> Post Copy (AI Generated)
              </label>
              <Textarea 
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Click 'Generate with AI' to create marketing copy..."
                className="min-h-[280px] rounded-2xl resize-none bg-background/50 p-4 leading-relaxed"
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/40">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Layout className="w-4 h-4 text-cyan-400" /> Marketing Image Generator
              </label>
              <MarketingImageGenerator 
                idea={selectedIdea as any} 
                headline={imgHeadline || (selectedIdea?.title || "SaaS Idea")}
                tagline={imgTagline || (selectedIdea?.tagline || "Tagline")}
                onImageGenerated={setCustomImage}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Image Headline</label>
                    <Input 
                      value={imgHeadline}
                      onChange={(e) => setImgHeadline(e.target.value)}
                      placeholder="Catchy headline..."
                      className="rounded-xl h-10"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Image Tagline</label>
                    <Input 
                      value={imgTagline}
                      onChange={(e) => setImgTagline(e.target.value)}
                      placeholder="Brief tagline..."
                      className="rounded-xl h-10"
                    />
                 </div>
              </div>
            </div>
          </Card>

          <div className="p-8 rounded-4xl brand-gradient text-white space-y-4 shadow-xl shadow-primary/20">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                 <Share2 className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">One-Click Share</h3>
                 <p className="text-xs opacity-80 italic">Ready for Facebook campaign</p>
               </div>
             </div>
             <p className="text-sm opacity-90 leading-relaxed">
               Open the Facebook Sharer with your AI copy and link. 
               We recommend downloading your generated image first to upload it manually for maximum impact!
             </p>
             <Button 
               className="w-full bg-white text-primary hover:bg-white/90 rounded-xl h-12 font-bold gap-2 border-0 shadow-lg"
               disabled={!selectedIdea}
               onClick={handleShare}
             >
               Open Facebook Sharer <ChevronRight className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* Right: Mockup */}
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Ad Preview
            </h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">OPTIMIZED FOR FB</span>
          </div>
          
          <div className="flex justify-center">
            <FacebookMockup 
              idea={selectedIdea as any} 
              text={postText} 
              customImageUrl={customImage} 
            />
          </div>

          <Card className="p-4 border-amber-500/20 bg-amber-500/5 flex gap-3 text-xs text-amber-500/80 leading-relaxed">
             <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
             <div>
               <p className="font-bold mb-1 text-amber-600 dark:text-amber-400">Campaign Recommendation</p>
               <p>
                 Use the <strong>Branding Image</strong> for the post itself, and the <strong>Copy</strong> in the description. 
                 The "Learn More" button in the preview automatically links to your live idea page.
               </p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
