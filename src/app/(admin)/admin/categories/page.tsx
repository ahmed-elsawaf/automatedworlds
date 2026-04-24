"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";

export default function AdminCategoriesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const categories = useQuery(api.categories.listCategories, isLoaded && isSignedIn ? { activeOnly: false } : "skip");
  
  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [adding, setAdding] = useState(false);

  if (categories === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      await createCategory({
        name: newName.trim(),
        icon: newIcon.trim() || undefined,
        sortOrder: categories?.length || 0,
      });
      setNewName("");
      setNewIcon("");
      toast.success("Category added");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Manage the taxonomy used to organize ideas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-card divide-y divide-border/60">
            {categories.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Tag className="w-8 h-8 mx-auto mb-3 opacity-20" />
                No categories defined.
              </div>
            ) : (
              categories.map((c) => (
                <div key={c._id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors group">
                  <div className="text-muted-foreground p-1 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 text-xl">
                    {c.icon || "📁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateCategory({ categoryId: c._id, isActive: !c.isActive })}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold ${c.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {c.isActive ? "Active" : "Hidden"}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={async () => {
                        if (confirm(`Delete category "${c.name}"? This will fail if ideas are still attached.`)) {
                          try {
                            await deleteCategory({ categoryId: c._id });
                            toast.success("Deleted category");
                          } catch (e: any) {
                            toast.error(e.message || "Failed to delete");
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
        </div>

        <div className="space-y-6">
          <form onSubmit={handleAdd} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Add Category</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  required 
                  placeholder="e.g. Finance" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Emoji Icon</label>
                <Input 
                  placeholder="e.g. 💰" 
                  value={newIcon} 
                  onChange={(e) => setNewIcon(e.target.value)} 
                  className="rounded-xl font-emoji"
                />
              </div>
              <Button type="submit" disabled={adding || !newName.trim()} className="w-full rounded-xl gap-2 brand-gradient border-0">
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
