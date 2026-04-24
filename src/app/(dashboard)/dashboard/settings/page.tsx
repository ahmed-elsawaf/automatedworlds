"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Building2, Globe, Mail, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const me = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name ?? "");
      setCompany(me.company ?? "");
      setWebsite(me.website ?? "");
      setBio(me.bio ?? "");
    }
  }, [me]);

  if (me === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
          <p className="text-muted-foreground text-sm">Loading your profile...</p>
        </div>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        name: name || undefined,
        company: company || undefined,
        website: website || undefined,
        bio: bio || undefined,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
        <p className="text-muted-foreground text-sm">
          Update your personal details and public profile.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="p-6 border-b border-border/60">
          <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
          
          <div className="space-y-5">
            {/* Email (Read Only - synced from Clerk) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <Input
                value={me.email}
                disabled
                className="bg-muted/50 cursor-not-allowed rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">Your email is managed via your secure auth provider.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <Input
                placeholder="Alex Johnson"
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
                placeholder="Acme Corp"
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
                placeholder="https://yoursite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Short Bio</label>
              <Textarea
                placeholder="Tell us what you're building..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="rounded-xl resize-none min-h-[100px]"
              />
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Information saved here is used for custom build branding.
          </p>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl gap-2"
          >
            {saving ? "Saving..." : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
