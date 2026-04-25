"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  DollarSign,
  User,
  Lightbulb,
  Link2,
  Search,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function AdminCustomizationDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Quote State
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteTimeline, setQuoteTimeline] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);

  // Delivery State
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [isDelivering, setIsDelivering] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const data = useQuery(api.customizations.getCustomizationRequestDetail, isAuthenticated ? { 
    requestId: requestId as Id<"customizationRequests"> 
  } : "skip");
  
  const sendMessage = useMutation(api.customizations.sendCustomizationMessage);
  const sendQuote = useMutation(api.customizations.adminSendQuote);
  const markReviewing = useMutation(api.customizations.adminStartReview);
  const startWork = useMutation(api.customizations.adminStartWork);
  const markDelivered = useMutation(api.customizations.adminMarkReadyForReview);
  const markRead = useMutation(api.customizations.markMessagesRead);

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

  async function handleSendQuote() {
    if (!data?._id || !quotePrice || !quoteTimeline) return;
    setIsQuoting(true);
    try {
      await sendQuote({
        requestId: data._id,
        quotedPrice: Math.round(parseFloat(quotePrice) * 100),
        quotedTimeline: quoteTimeline,
        quoteValidDays: 7
      });
      toast.success("Quote sent to client!");
    } catch (err) {
      toast.error("Failed to send quote.");
    } finally {
      setIsQuoting(false);
    }
  }

  async function handleMarkDelivered() {
    if (!data?._id || !deliveryUrl) return;
    setIsDelivering(true);
    try {
      await markDelivered({
        requestId: data._id,
        deliveredUrl: deliveryUrl
      });
      toast.success("Build marked as ready for review!");
    } catch (err) {
      toast.error("Failed to mark delivered.");
    } finally {
      setIsDelivering(false);
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

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            <Link href="/admin/customizations" className="hover:text-primary transition-colors">Customizations</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Admin Review</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {data.brandName || "Untitled"} — {data.idea?.title}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {data.user?.email}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(data.createdAt, "MMM d, HH:mm")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.status === "submitted" && (
            <Button onClick={() => markReviewing({ requestId: data._id })} className="rounded-xl gap-2 font-bold">
              <Search className="w-4 h-4" /> Start Review
            </Button>
          )}
          {data.status === "accepted" && (
            <Button onClick={() => startWork({ requestId: data._id })} className="rounded-xl gap-2 font-bold brand-gradient border-0">
              <Wrench className="w-4 h-4" /> Start Building
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Client Brief & Tools */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Status Banner */}
          <div className={cn(
            "p-6 rounded-4xl border flex items-center justify-between gap-4",
            data.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-primary/10 border-primary/20"
          )}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Status</p>
              <h3 className="text-xl font-bold uppercase tracking-tight">{data.status.replace("_", " ")}</h3>
            </div>
            {data.deliveredUrl && (
              <Button asChild variant="outline" className="rounded-xl h-10 gap-2">
                <a href={data.deliveredUrl} target="_blank" rel="noopener noreferrer">
                  View Delivered URL <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>

          {/* Brief Content */}
          <Card className="p-8 rounded-4xl border-border/60 shadow-sm space-y-8">
            <h2 className="text-xl font-bold border-b border-border/60 pb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Client Brief
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Target Brand Name</h4>
                  <p className="text-lg font-semibold">{data.brandName || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Target Domain</h4>
                  <p className="font-medium text-primary flex items-center gap-1">
                    {data.targetDomain || "Admin suggestion requested"}
                    {data.targetDomain && <ExternalLink className="w-3 h-3" />}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Brand Colors</h4>
                  <div className="flex gap-3">
                    {data.brandColors?.map((c: string) => (
                      <div key={c} className="group relative">
                        <div className="w-12 h-12 rounded-xl border border-border/60 shadow-sm" style={{ backgroundColor: c }} />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background px-1 rounded border">{c}</span>
                      </div>
                    ))}
                    {!data.brandColors?.length && <p className="text-sm italic text-muted-foreground">None provided</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Custom Features Requested</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-2xl border border-border/40">
                    {data.customFeatures || "No special features requested beyond standard build."}
                  </p>
                </div>
                {data.additionalNotes && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Additional Notes</h4>
                    <p className="text-sm italic text-muted-foreground">"{data.additionalNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Admin Quoting Engine */}
          {(data.status === "submitted" || data.status === "reviewing" || data.status === "quoted") && (
            <Card className="p-8 rounded-4xl border-amber-500/20 bg-amber-500/5 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-600">
                <DollarSign className="w-5 h-5" /> Quoting Engine
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Quoted Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      placeholder="e.g. 1500"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      className="pl-9 rounded-xl h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Delivery Timeline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. 5-7 business days"
                      value={quoteTimeline}
                      onChange={(e) => setQuoteTimeline(e.target.value)}
                      className="pl-9 rounded-xl h-12"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSendQuote} 
                disabled={isQuoting || !quotePrice || !quoteTimeline}
                className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white gap-2"
              >
                {isQuoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> {data.status === "quoted" ? "Update Quote" : "Send Quote to Client"}</>}
              </Button>
            </Card>
          )}

          {/* Delivery Tool */}
          {(data.status === "in_progress" || data.status === "review_ready") && (
            <Card className="p-8 rounded-4xl border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                <Rocket className="w-5 h-5" /> Delivery Tool
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Production URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://app.client-site.com"
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    className="pl-9 rounded-xl h-12"
                  />
                </div>
              </div>

              <Button 
                onClick={handleMarkDelivered} 
                disabled={isDelivering || !deliveryUrl}
                className="w-full h-12 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              >
                {isDelivering ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4" /> Mark Delivered & Notify Client</>}
              </Button>
            </Card>
          )}
        </div>

        {/* RIGHT: Chat Thread */}
        <div className="lg:col-span-4 h-[800px] flex flex-col">
          <Card className="flex-1 flex flex-col rounded-4xl border-border/60 shadow-lg overflow-hidden bg-card/50 backdrop-blur-xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {data.user?.email.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold">Client Support</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{data.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              {data.messages?.map((msg: any) => {
                const isAdmin = msg.senderRole === "admin";
                return (
                  <div 
                    key={msg._id}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      isAdmin ? "self-end items-end" : "self-start items-start"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      isAdmin 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted text-foreground rounded-tl-none"
                    )}>
                      {msg.body}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                      {format(msg.createdAt, "HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/60 bg-muted/10">
              <form onSubmit={handleSendMessage} className="relative">
                <Textarea 
                  placeholder="Reply to client..."
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

