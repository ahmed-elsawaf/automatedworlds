"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Paintbrush, 
  Rocket, 
  MessageSquare, 
  Layout, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Palette,
  Globe,
  UploadCloud,
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const STEPS = [
  { id: "intro", title: "Welcome", icon: Sparkles },
  { id: "brand", title: "Branding", icon: Palette },
  { id: "tech", title: "Setup", icon: Globe },
  { id: "features", title: "Features", icon: Layout },
  { id: "submit", title: "Review", icon: CheckCircle2 },
];

export default function NewCustomizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") as Id<"orders"> | null;
  const ideaId = searchParams.get("ideaId") as Id<"ideas"> | null;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    brandName: "",
    brandColors: ["", "", ""],
    targetDomain: "",
    customFeatures: "",
    additionalNotes: "",
  });

  const idea = useQuery(api.ideas.getIdeaById, ideaId ? { ideaId } : "skip");
  const createRequest = useMutation(api.customizations.submitCustomizationRequest);

  useEffect(() => {
    if (!orderId || !ideaId) {
      toast.error("Invalid customization request parameters.");
      router.push("/dashboard/customizations");
    }
  }, [orderId, ideaId, router]);

  const next = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  async function handleSubmit() {
    if (!orderId || !ideaId) return;
    setIsSubmitting(true);
    try {
      const requestId = await createRequest({
        orderId,
        ideaId,
        brandName: formData.brandName,
        brandColors: formData.brandColors.filter(Boolean),
        targetDomain: formData.targetDomain,
        customFeatures: formData.customFeatures,
        additionalNotes: formData.additionalNotes,
      });
      toast.success("Request submitted successfully! 🚀");
      router.push(`/dashboard/customizations/${requestId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!idea) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Custom Build Wizard</h1>
            <p className="text-muted-foreground text-sm">
              Customizing: <span className="text-foreground font-semibold">{idea.title}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-primary">Step {currentStep + 1} of {STEPS.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => (
            <div 
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                i <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-4xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Paintbrush className="w-32 h-32 rotate-12" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold italic">Let's build your dream SaaS.</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                You've taken the first step toward launching your business. Over the next few minutes, we'll collect everything we need to brand, configure, and deploy your custom instance of <strong>{idea.title}</strong>.
              </p>
              <div className="bg-muted/50 rounded-2xl p-6 border border-border/40">
                <h4 className="font-bold text-sm uppercase tracking-widest mb-3 text-muted-foreground">What happens next?</h4>
                <ul className="space-y-3">
                  {[
                    "Provide your brand name, colors, and logo",
                    "Specify your target domain and hosting needs",
                    "Request custom features or UI tweaks",
                    "Our team reviews and starts the build in 24 hours"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold mb-2">Visual Identity</h2>
                <p className="text-muted-foreground">Define how your brand will look and feel.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Brand Name</label>
                  <Input 
                    placeholder="e.g. Acme Analytics"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="rounded-xl h-12 bg-muted/30"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold">Brand Colors (Primary, Secondary, Accent)</label>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.brandColors.map((color, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg border border-border/60 shrink-0 overflow-hidden relative">
                            <input 
                              type="color" 
                              value={color || "#6366f1"} 
                              onChange={(e) => {
                                const newColors = [...formData.brandColors];
                                newColors[i] = e.target.value;
                                setFormData({ ...formData, brandColors: newColors });
                              }}
                              className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                            />
                          </div>
                          <Input 
                            placeholder="#HEX"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...formData.brandColors];
                              newColors[i] = e.target.value;
                              setFormData({ ...formData, brandColors: newColors });
                            }}
                            className="rounded-lg h-10 font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:border-primary/50 transition-colors bg-muted/20">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Upload Brand Logo</p>
                    <p className="text-xs text-muted-foreground mt-1">SVG, PNG, or AI (Max 5MB)</p>
                  </div>
                  <Button variant="secondary" size="sm" className="rounded-lg">Browse Files</Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold mb-2">Technical Setup</h2>
                <p className="text-muted-foreground">Where should we launch your business?</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Target Domain</label>
                  <Input 
                    placeholder="e.g. app.acmeanalytics.com"
                    value={formData.targetDomain}
                    onChange={(e) => setFormData({ ...formData, targetDomain: e.target.value })}
                    className="rounded-xl h-12 bg-muted/30"
                  />
                  <p className="text-[10px] text-muted-foreground">Leave blank if you want us to suggest/purchase a domain for you.</p>
                </div>

                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Managed Hosting Included</h4>
                    <p className="text-xs text-muted-foreground mt-1">Your deposit includes the first 3 months of managed hosting on Vercel/Convex. We handle all infrastructure scaling for you.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold mb-2">Custom Features</h2>
                <p className="text-muted-foreground">What extra "special sauce" do you need?</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Additional Features or Tweaks</label>
                  <Textarea 
                    placeholder="e.g. Integrate with Slack, add a Dark Mode toggle, or a custom user onboarding flow..."
                    value={formData.customFeatures}
                    onChange={(e) => setFormData({ ...formData, customFeatures: e.target.value })}
                    className="rounded-2xl min-h-[150px] bg-muted/30 p-4"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Additional Notes</label>
                  <Textarea 
                    placeholder="Any other details we should know?"
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    className="rounded-2xl min-h-[100px] bg-muted/30 p-4"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2 italic text-emerald-500">Ready to go!</h2>
                <p className="text-muted-foreground">Review your details and submit for build phase.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border/60 bg-muted/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Brand Name</p>
                  <p className="font-semibold">{formData.brandName || "Not provided"}</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-muted/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Target Domain</p>
                  <p className="font-semibold">{formData.targetDomain || "We'll suggest one"}</p>
                </div>
                <div className="col-span-full p-4 rounded-xl border border-border/60 bg-muted/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Custom Features</p>
                  <p className="text-sm line-clamp-2">{formData.customFeatures || "Standard build"}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground italic text-center">
                Submitting this form starts the build phase. You'll be able to chat with our developers in the next step.
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-border/60">
          <Button 
            variant="ghost" 
            onClick={prev} 
            disabled={currentStep === 0 || isSubmitting}
            className="rounded-xl gap-2 h-12 px-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="rounded-xl gap-2 h-12 px-8 brand-gradient border-0 text-white font-bold"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Request <CheckCircle2 className="w-4 h-4" /></>}
            </Button>
          ) : (
            <Button 
              onClick={next} 
              className="rounded-xl gap-2 h-12 px-8"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
