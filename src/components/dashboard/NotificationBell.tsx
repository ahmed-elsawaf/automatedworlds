"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  const notifications = useQuery(api.notifications.getMyNotifications, {
    paginationOpts: { numItems: 8, cursor: null },
  });

  const unreadCount = useQuery(api.notifications.getUnreadCount) ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifications === undefined ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : notifications.page.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              All caught up! 🎉
            </div>
          ) : (
            notifications.page.map((n) => (
              <Link
                key={n._id}
                href={n.actionUrl ?? "/dashboard/notifications"}
                className={cn(
                  "flex flex-col gap-0.5 px-4 py-3 text-sm hover:bg-muted/50 transition-colors",
                  !n.isRead && "bg-primary/5"
                )}
              >
                {!n.isRead && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <p className="font-medium text-foreground leading-snug">
                      {n.title}
                    </p>
                  </div>
                )}
                {n.isRead && (
                  <p className="font-medium text-foreground leading-snug">
                    {n.title}
                  </p>
                )}
                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                  {n.body}
                </p>
              </Link>
            ))
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border/60">
          <Link
            href="/dashboard/notifications"
            className="text-xs text-primary hover:underline"
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
