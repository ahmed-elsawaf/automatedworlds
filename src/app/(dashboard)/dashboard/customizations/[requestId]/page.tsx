"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Wrench, 
  Clock, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight,
  FileText,
  AlertCircle,
  Calendar,
  Box,
  Layout,
  Globe,
  Loader2,
  TrendingUp,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const STATUS_STEPS = [
  { id: "submitted", label: "Brief Submitted", icon: FileText },
  { id: "reviewing", label: "Under Review", icon: Clock },
  { id: "quoted",    label: "Quote Ready", icon: AlertCircle },
  { id: "accepted",  label: "Build Commencing", icon: Box },
  { id: "in_progress", label: "In Progress", icon: Wrench },
  { id: "review_ready", label: "Delivered", icon: Globe },
  { id: "completed", label: "Fully Complete", icon: CheckCircle2 },
];

export default function CustomizationDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const data = useQuery(api.customizations.getCustomizationRequestDetail, { 
    requestId: requestId as Id<"customizationRequests"> 
  });
  const sendMessage = useMutation(api.customizations.sendCustomizationMessage);
  const acceptQuote = useMutation(api.customizations.acceptCustomizationQuote);
  const markRead = useMutation(api.customizations.markMessagesRead);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (data?._id) {
      markRead({ requestId: data._id });
    }
  }, [data?.messages?.length, data?._id, markRead]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isSending || !data?._id) return;

    setIsSending(true);
    try {
      await sendMessage({ requestId: data._id, body: message.trim() });
      setMessage("");
    } catch (err) {
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleAcceptQuote() {
    if (!data?._id) return;
    try {
      await acceptQuote({ requestId: data._id });
      toast.success("Quote accepted! Work will begin shortly.");
    } catch (err) {
      toast.error("Failed to accept quote.");
    }
  }

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <div>Request not found.</div>;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === data.status);
  const isQuoted = data.status === "quoted";
  const isDelivered = data.status === "review_ready" || data.status === "completed";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            <Link href="/dashboard/customizations" className="hover:text-primary transition-colors">Customizations</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Request Details</span>
          </div>
          <h1 className="text-3xl font-bold italic">{data.idea?.title} Customization</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Request ID: <span className="font-mono text-xs">{data._id}</span>
          </p>
        </div>

        {isDelivered && data.deliveredUrl && (
          <Button asChild className="rounded-xl gap-2 brand-gradient border-0 font-bold h-12 px-6 shadow-lg shadow-primary/20">
            <a href={data.deliveredUrl} target="_blank" rel="noopener noreferrer">
              View Live Build <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Details & Progress */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress Tracker */}
          <Card className="p-6 rounded-4xl border-border/60 bg-card/50 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Clock className="w-24 h-24 rotate-12" />
            </div>
            
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Build Progress
            </h3>

            <div className="relative flex justify-between items-start">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10" />
              <div 
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-1000 -z-10" 
                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }} 
              />

              {STATUS_STEPS.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                
                return (
                  <div key={step.id} className="flex flex-col items-center text-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                      isActive ? "bg-background border-primary" : "bg-muted border-transparent",
                      isCurrent && "ring-4 ring-primary/20 scale-110"
                    )}>
                      <step.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tight max-w-[80px]",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quote Banner */}
          {isQuoted && (
            <div className="p-8 rounded-4xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Quote Ready</p>
                <h2 className="text-2xl font-bold mb-2">Build Proposal is Ready</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Our team has reviewed your brief. The total for this customization is <strong className="text-foreground">${((data.quotedPrice || 0) / 100).toFixed(0)}</strong> with an estimated delivery of <strong className="text-foreground">{data.quotedTimeline}</strong>.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button onClick={handleAcceptQuote} className="rounded-xl h-12 px-8 brand-gradient border-0 font-bold text-white shadow-lg shadow-primary/20">
                  Accept & Start Build
                </Button>
                <p className="text-[10px] text-center text-muted-foreground italic">
                  Remaining balance will be invoiced upon completion.
                </p>
              </div>
            </div>
          )}

          {/* Brief Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 rounded-3xl border-border/60 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60">
                <Palette className="w-4 h-4" /> Brand Identity
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Name</p>
                  <p className="font-semibold">{data.brandName || "To be decided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Primary Colors</p>
                  <div className="flex gap-2">
                    {data.brandColors?.map((c: string) => (
                      <div key={c} className="w-8 h-8 rounded-lg border border-border/40" style={{ backgroundColor: c }} title={c} />
                    ))}
                    {!data.brandColors?.length && <p className="text-sm italic">Pending</p>}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-border/60 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60">
                <Globe className="w-4 h-4" /> Technical
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Domain</p>
                  <p className="font-semibold">{data.targetDomain || "Awaiting suggestion"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Custom Features</p>
                  <p className="text-sm line-clamp-2">{data.customFeatures || "Standard build"}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT: Chat Thread */}
        <div className="lg:col-span-4 h-[700px] flex flex-col">
          <Card className="flex-1 flex flex-col rounded-4xl border-border/60 shadow-lg overflow-hidden bg-card/50 backdrop-blur-xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  AW
                </div>
                <div>
                  <h4 className="text-sm font-bold">Build Team</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Typically replies in <br/> 2-4 hours
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              <div className="text-center py-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/60">
                  Thread Started {format(data.createdAt, "MMM d, yyyy")}
                </span>
              </div>

              {data.messages?.map((msg: any) => {
                const isAdmin = msg.senderRole === "admin";
                return (
                  <div 
                    key={msg._id}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      isAdmin ? "self-start items-start" : "self-end items-end"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      isAdmin 
                        ? "bg-muted text-foreground rounded-tl-none" 
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    )}>
                      {msg.body}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                      {format(msg.createdAt, "HH:mm")}
                    </span>
                  </div>
                );
              })}

              {!data.messages?.length && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                  <MessageSquare className="w-12 h-12 mb-4" />
                  <p className="text-sm italic">Your brief is under review. You can message the team here if you have any questions.</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/60 bg-muted/10">
              <form onSubmit={handleSendMessage} className="relative">
                <Textarea 
                  placeholder="Message the team..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-xl min-h-[45px] max-h-[150px] pr-12 py-3 bg-background border-border/60 focus:ring-1 ring-primary/20 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
              <p className="text-[9px] text-muted-foreground mt-2 text-center italic">
                Markdown is supported (bold, lists, etc.)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

