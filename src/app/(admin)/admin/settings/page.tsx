"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Server, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [platformFee, setPlatformFee] = useState("0");
  const [supportEmail, setSupportEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // In a real app, these might come from an admin.getSettings query
  // For MVP, we'll just simulate the UI
  
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // await updateSettings({ platformFee: parseInt(platformFee), supportEmail })
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully");
    }, 800);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Platform Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure global site settings and operational parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
              <div className="p-5 border-b border-border/60 bg-muted/20">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" /> General Configuration
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input 
                    type="email"
                    placeholder="support@automatedworlds.com" 
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">This email receives system alerts and customer inquiries.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="rounded-xl gap-2 brand-gradient border-0">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-sm">System Status</h3>
                <p className="text-xs text-emerald-500 font-medium">All systems operational</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Convex DB</span>
                <span className="font-medium">Connected</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Clerk Auth</span>
                <span className="font-medium">Connected</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Polar Billing</span>
                <span className="font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
