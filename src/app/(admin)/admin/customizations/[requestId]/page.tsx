"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Paintbrush, Globe, Box, MessageSquare, Check, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Brief Submitted" },
  { value: "reviewing", label: "Under Review" },
  { value: "quoted", label: "Quote Ready" },
  { value: "accepted", label: "Quote Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "review_ready", label: "Ready for Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminCustomizationDetailPage() {
  const { requestId } = useParams<{ requestId: Id<"customizationRequests"> }>();
  const router = useRouter();
  
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const req = useQuery(api.customizations.getCustomizationRequestDetail, { requestId });
  
  const sendMessage = useMutation(api.customizations.sendCustomizationMessage);
  const updateStatus = useMutation(api.customizations.adminUpdateCustomizationStatus);

  if (req === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  if (req === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Request not found</h1>
        <Button asChild className="rounded-xl"><Link href="/admin/customizations">Go Back</Link></Button>
      </div>
    );
  }

  const idea = req.idea as any;
  const user = req.user as any;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage({ requestId, body: msg });
      setMsg("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (statusUpdating || newStatus === req?.status) return;
    setStatusUpdating(true);
    try {
      await updateStatus({ requestId, status: newStatus });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Customizations
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Request Details</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Started on {format(req._creationTime, "MMMM d, yyyy")}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-card border border-border/60 p-2 rounded-xl">
            <span className="text-xs font-semibold text-muted-foreground pl-2 uppercase tracking-widest">Status:</span>
            <select 
              className="h-8 rounded-lg border-transparent bg-muted px-3 text-sm font-medium focus:ring-2 focus:ring-primary disabled:opacity-50"
              value={req.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Brief & Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client Details */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Client</h2>
            </div>
            <div className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <Link href={`/admin/users/${user?._id}`} className="font-semibold text-sm truncate hover:underline">{user?.name || "Unknown"}</Link>
                <a href={`mailto:${user?.email}`} className="text-xs text-primary hover:underline mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </a>
              </div>
            </div>
          </div>

          {/* Idea details */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Base Product</h2>
            </div>
            <div className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Box className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <Link href={`/admin/ideas/${idea?._id}`} className="font-semibold text-sm truncate hover:underline">{idea?.title ?? "Unknown Product"}</Link>
                <p className="text-xs text-muted-foreground mt-1">Purchased custom build package.</p>
              </div>
            </div>
          </div>

          {/* Submitted Brief */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Project Brief</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5" /> Brand Name
                </p>
                <p className="text-sm">{req.brandName || <span className="text-muted-foreground italic">Not specified</span>}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Target Domain
                </p>
                <p className="text-sm">{req.targetDomain || <span className="text-muted-foreground italic">Not specified</span>}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Color Scheme
                </p>
                <div className="flex items-center gap-2">
                  {req.brandColors?.[0] && (
                    <div className="w-6 h-6 rounded-md border shadow-sm" style={{ backgroundColor: req.brandColors[0] }} title={req.brandColors[0]} />
                  )}
                  {req.brandColors?.[1] && (
                    <div className="w-6 h-6 rounded-md border shadow-sm" style={{ backgroundColor: req.brandColors[1] }} title={req.brandColors[1]} />
                  )}
                  {(!req.brandColors || req.brandColors.length === 0) && (
                    <span className="text-sm text-muted-foreground italic">Not specified</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Additional Notes
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {req.additionalNotes || <span className="text-muted-foreground italic">No extra notes provided.</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card flex flex-col h-[600px] lg:h-auto overflow-hidden">
          <div className="p-5 border-b border-border/60 bg-muted/20 flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Client Communication</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col-reverse">
            {!req.messages || req.messages.length === 0 ? (
              <div className="text-center py-10 my-auto">
                <p className="text-muted-foreground text-sm">No messages yet. Send a message to the client.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {req.messages?.map((m: any) => {
                  const isAdmin = m.isFromAdmin;
                  return (
                    <div key={m._id} className={cn("flex flex-col max-w-[85%]", !isAdmin ? "mr-auto" : "ml-auto items-end")}>
                      <div className={cn(
                        "p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                        !isAdmin 
                          ? "bg-muted text-foreground rounded-tl-sm border border-border/60" 
                          : "brand-gradient text-white rounded-tr-sm border border-transparent shadow-sm"
                      )}>
                        {m.body}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="font-medium">{!isAdmin ? user?.name || "Client" : "You (Admin)"}</span>
                        <span>•</span>
                        <span>{format(m._creationTime, "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-border/60 bg-background/50 shrink-0">
            <div className="relative">
              <Textarea 
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Type your reply to the client..."
                className="pr-12 min-h-[80px] rounded-xl resize-none bg-background focus:bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute bottom-2 right-2 rounded-lg w-8 h-8"
                disabled={sending || !msg.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
