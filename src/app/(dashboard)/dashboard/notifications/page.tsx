"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.getMyNotifications, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  const markRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotif = useMutation(api.notifications.deleteNotification);

  if (notifications === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground text-sm">Loading your activity...</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse border border-border/60" />
          ))}
        </div>
      </div>
    );
  }

  const unreadCount = notifications.page.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            Updates on your orders, customizations, and account.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="rounded-xl gap-2 w-full sm:w-auto"
            onClick={async () => {
              try {
                await markAllRead();
                toast.success("All caught up!");
              } catch {
                toast.error("Failed to mark all as read");
              }
            }}
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.page.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/60 bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BellRing className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            We'll notify you here when there are updates to your purchases or custom build requests.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/60 bg-card">
          {notifications.page.map((n) => (
            <div 
              key={n._id}
              className={cn(
                "flex items-start gap-4 p-5 transition-colors group",
                !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
              )}
            >
              {/* Status Dot */}
              <div className="mt-1.5 shrink-0">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  !n.isRead ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-muted"
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h3 className={cn("text-base", !n.isRead ? "font-bold text-foreground" : "font-semibold text-foreground/90")}>
                    {n.title}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className={cn("text-sm mb-3 leading-relaxed", !n.isRead ? "text-foreground/80" : "text-muted-foreground")}>
                  {n.body}
                </p>
                
                <div className="flex items-center gap-3">
                  {n.actionUrl && (
                    <Button asChild variant="secondary" size="sm" className="h-8 text-xs rounded-lg">
                      <Link href={n.actionUrl}>View Details</Link>
                    </Button>
                  )}
                  {!n.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={() => markRead({ notificationId: n._id })}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>

              {/* Delete action */}
              <button
                onClick={async () => {
                  try {
                    await deleteNotif({ notificationId: n._id });
                    toast.success("Notification deleted");
                  } catch {
                    toast.error("Failed to delete");
                  }
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
