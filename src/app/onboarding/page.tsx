"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, ArrowRight, CheckCircle2, User, Building2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

const STEPS = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Profile" },
  { id: 3, label: "Ready" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const me = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateProfile);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  // Already onboarded → redirect
  if (me?.onboardingComplete) {
    router.replace("/dashboard");
    return null;
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      await updateProfile({ name: name || undefined, company: company || undefined, website: website || undefined, bio: bio || undefined });
      await completeOnboarding();
      router.push("/browse");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-md">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-xl">
          <span className="brand-gradient-text">Automated</span>
          <span>Worlds</span>
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200",
              step > s.id
                ? "bg-primary border-primary text-primary-foreground"
                : step === s.id
                ? "border-primary text-primary"
                : "border-border text-muted-foreground"
            )}>
              {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
            </div>
            <span className={cn("text-sm font-medium", step === s.id ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("w-10 h-px", step > s.id ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="w-full max-w-md">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl brand-gradient mx-auto flex items-center justify-center shadow-lg brand-glow">
              <Zap className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3">Welcome aboard! 🎉</h1>
              <p className="text-muted-foreground leading-relaxed">
                You&apos;re about to unlock access to 50+ professionally researched SaaS ideas — each with live demos, market research, and ready-to-launch code.
              </p>
            </div>
            <div className="text-left space-y-3 p-5 rounded-2xl border border-border/60 bg-card">
              {[
                "Browse 50+ data-backed SaaS ideas",
                "Test live demos before you buy",
                "Purchase source code and launch in days",
                "Request custom branding & features",
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full h-12 rounded-xl gap-2 text-base brand-gradient border-0 hover:opacity-90"
              onClick={() => setStep(2)}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Tell us about yourself</h1>
              <p className="text-muted-foreground text-sm">Optional — you can always update this later.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Your Name
                </label>
                <Input
                  id="onboarding-name"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Company / Project
                </label>
                <Input
                  id="onboarding-company"
                  placeholder="e.g. Acme Corp or Solo founder"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Website
                </label>
                <Input
                  id="onboarding-website"
                  placeholder="https://yoursite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Short Bio</label>
                <Textarea
                  id="onboarding-bio"
                  placeholder="Tell us what you're building…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1 rounded-xl gap-2" onClick={() => setStep(3)}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">You&apos;re all set! 🚀</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your account is ready. Start browsing ideas and find your next business today.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full h-12 rounded-xl gap-2 text-base brand-gradient border-0 hover:opacity-90"
              onClick={handleFinish}
              disabled={submitting}
            >
              {submitting ? "Setting up…" : "Browse Ideas →"}
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleFinish}
              disabled={submitting}
            >
              Skip and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
