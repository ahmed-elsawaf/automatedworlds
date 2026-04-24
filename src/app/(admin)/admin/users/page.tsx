"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const users = useQuery(api.admin.listUsers, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  if (users === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  // Basic client filtering
  const filtered = users.page.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.clerkId.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage your platform members and view their purchase history.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or Clerk ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Activity</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No users found matching "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link href={`/admin/users/${user._id}`} className="font-semibold text-foreground hover:text-primary transition-colors mb-0.5 truncate max-w-[200px]">
                          {user.name || "Unknown"}
                        </Link>
                        <a href={`mailto:${user.email}`} className="text-xs text-muted-foreground hover:underline">{user.email}</a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border bg-violet-500/10 text-violet-500 border-violet-500/20">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border bg-muted text-muted-foreground">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">${((user.totalSpent || 0) / 100).toFixed(0)} spent</span>
                        <span className="text-xs text-muted-foreground">{user.totalPurchases || 0} purchases</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/users/${user._id}`}><ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          Showing {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          {users.isDone === false && (
            <Button variant="outline" size="sm" className="h-7 text-xs">Load More</Button>
          )}
        </div>
      </div>
    </div>
  );
}
