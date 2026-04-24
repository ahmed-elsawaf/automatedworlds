"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../../../../convex/_generated/dataModel";

const SECTION_TYPES = [
  "markdown",
  "feature_list",
  "screenshot_gallery",
  "metrics_grid",
  "competitor_table",
  "revenue_breakdown",
  "faq",
  "testimonial",
  "cta_block",
  "video_embed",
  "tech_stack_grid",
  "roadmap",
  "checklist",
];

export default function AdminIdeaSectionsPage() {
  const { ideaId } = useParams<{ ideaId: Id<"ideas"> }>();
  const router = useRouter();

  const idea = useQuery(api.ideas.getIdeaById, { ideaId });
  const rawSections = useQuery(api.ideas.getIdeaSections, { ideaId });
  
  const upsertSection = useMutation(api.ideas.upsertIdeaSection);
  const deleteSection = useMutation(api.ideas.deleteIdeaSection);
  // Optional: reorderSection = useMutation(api.ideas.reorderIdeaSections) (drag-and-drop omitted for brevity)

  const [editingId, setEditingId] = useState<Id<"ideaSections"> | "new" | null>(null);
  
  // Form State
  const [type, setType] = useState<any>("markdown");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  if (idea === undefined || rawSections === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Idea Details
        </Button>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  if (idea === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Idea not found</h1>
        <Button asChild className="rounded-xl"><Link href="/admin/ideas">Go Back</Link></Button>
      </div>
    );
  }

  const sections = [...rawSections].sort((a, b) => a.sortOrder - b.sortOrder);

  function openEditor(s?: any) {
    if (s) {
      setEditingId(s._id);
      setType(s.type);
      setTitle(s.title || "");
      setContent(s.content);
      setIsVisible(s.isVisible);
    } else {
      setEditingId("new");
      setType("markdown");
      setTitle("");
      setContent("");
      setIsVisible(true);
    }
  }

  async function handleSave() {
    try {
      await upsertSection({
        ideaId,
        sectionId: editingId === "new" ? undefined : (editingId as Id<"ideaSections">),
        type,
        title: title.trim() || undefined,
        content,
        sortOrder: editingId === "new" ? sections.length : sections.find(s => s._id === editingId)?.sortOrder ?? 0,
        isVisible,
      });
      toast.success("Section saved");
      setEditingId(null);
    } catch {
      toast.error("Failed to save section");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4 text-muted-foreground" onClick={() => router.push(`/admin/ideas/${ideaId}`)}>
          <ArrowLeft className="w-4 h-4" /> Back to Idea Settings
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Managing sections for <span className="font-semibold text-foreground">{idea.title}</span>
            </p>
          </div>
          <Button onClick={() => openEditor()} className="rounded-xl gap-2 brand-gradient border-0" disabled={editingId !== null}>
            <Plus className="w-4 h-4" /> Add Section
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Section List */}
        <div className="lg:col-span-1 space-y-3">
          {sections.length === 0 && editingId === null ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 text-muted-foreground text-sm">
              No sections created yet. Add one to start building the page.
            </div>
          ) : (
            sections.map((s, i) => (
              <div 
                key={s._id}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${editingId === s._id ? "border-primary bg-primary/5" : "border-border/60 bg-card hover:border-primary/30"}`}
              >
                <div className="text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground p-1 -ml-2">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditor(s)}>
                  <p className="font-semibold text-sm truncate">{s.title || <span className="italic text-muted-foreground">Untitled {s.type}</span>}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{s.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!s.isVisible && <EyeOff className="w-4 h-4 text-amber-500 shrink-0 mr-1" />}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm("Delete this section?")) {
                        try {
                          await deleteSection({ sectionId: s._id });
                          if (editingId === s._id) setEditingId(null);
                          toast.success("Section deleted");
                        } catch {
                          toast.error("Failed to delete");
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-2">
          {editingId === null ? (
            <div className="h-full min-h-[400px] rounded-2xl border border-border/60 bg-card flex flex-col items-center justify-center text-center p-8">
              <Settings2 className="w-12 h-12 text-muted/50 mb-4" />
              <h3 className="font-semibold mb-2">Select a section to edit</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Click on a section from the left sidebar to edit its content, or add a new section.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                <h2 className="font-semibold text-sm">{editingId === "new" ? "New Section" : "Edit Section"}</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsVisible(!isVisible)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${isVisible ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"}`}
                  >
                    {isVisible ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Section Type</label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      disabled={editingId !== "new"}
                    >
                      {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Title (Optional)</label>
                    <Input 
                      placeholder="e.g. Core Features" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center justify-between">
                    Content
                    <span className="text-[10px] text-muted-foreground font-normal">JSON or Markdown depending on type</span>
                  </label>
                  <Textarea 
                    placeholder="Enter section content..." 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    className="rounded-xl font-mono text-xs min-h-[300px] resize-y"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button onClick={handleSave} className="rounded-xl gap-2 brand-gradient border-0">
                    <Save className="w-4 h-4" /> Save Section
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
