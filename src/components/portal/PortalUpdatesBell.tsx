"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";

type NotificationTab = "all" | "unread";

interface PatientPortalNotification {
  notification_id: string;
  request_reference?: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  channel: "portal";
  delivery_status: "visible";
}

function formatUpdateDateTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getUnreadBadgeLabel(count: number): string {
  return count > 9 ? "9+" : String(count);
}

export default function PortalUpdatesBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<PatientPortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const visibleNotifications = useMemo(() => {
    const filtered = activeTab === "unread"
      ? notifications.filter((notification) => !notification.read_at)
      : notifications;
    return filtered.slice(0, 10);
  }, [activeTab, notifications]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setLoading(true);
      try {
        configureCognito();
        const idToken = await getIdToken();
        if (!idToken) throw new Error("Session expired.");

        const res = await fetch("/api/patient/notifications", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json().catch(() => ({})) as {
          notifications?: PatientPortalNotification[];
          unreadCount?: number;
        };
        if (!cancelled && res.ok) {
          const safeNotifications = Array.isArray(data.notifications) ? data.notifications : [];
          setToken(idToken);
          setNotifications(safeNotifications);
          setUnreadCount(typeof data.unreadCount === "number"
            ? data.unreadCount
            : safeNotifications.filter((notification) => !notification.read_at).length);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function markRead(notificationId: string) {
    const target = notifications.find((notification) => notification.notification_id === notificationId);
    if (!target || target.read_at) return;

    const optimisticReadAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notification.notification_id === notificationId
          ? { ...notification, read_at: optimisticReadAt }
          : notification
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      const idToken = token ?? await getIdToken();
      if (!idToken) throw new Error("Session expired.");

      const res = await fetch("/api/patient/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      const data = await res.json().catch(() => ({})) as {
        notification?: PatientPortalNotification;
      };
      if (res.ok && data.notification) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.notification_id === notificationId ? data.notification! : notification
          )
        );
      }
    } catch {
      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, read_at: target.read_at }
            : notification
        )
      );
      setUnreadCount((count) => count + 1);
    }
  }

  return (
    <div ref={popoverRef} className={cn("relative z-[100]", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-charcoal/70 shadow-sm transition-colors hover:bg-sand-pale focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.25 2.25 0 01-5.714 0m9.607-3.474A7.475 7.475 0 0017.25 9V7.5a5.25 5.25 0 00-10.5 0V9a7.475 7.475 0 00-1.5 4.608l-.36 2.16A1.5 1.5 0 006.37 17.5h11.26a1.5 1.5 0 001.48-1.732l-.36-2.16z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#0B5C6C] px-1 text-[10px] font-bold leading-none text-white">
            {getUnreadBadgeLabel(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[110] mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-sand bg-white shadow-xl">
          <div className="border-b border-sand bg-sand-pale/60 px-4 py-3">
            <p className="text-sm font-semibold text-charcoal">Notifications</p>
            <p className="mt-0.5 text-xs leading-5 text-charcoal/60">
              Updates from Midland Sleep about your supply requests.
            </p>
          </div>

          <div className="flex border-b border-sand bg-white px-2 py-2">
            {(["all", "unread"] as NotificationTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  activeTab === tab
                    ? "bg-[#EFF5F4] text-[#0B5C6C]"
                    : "text-charcoal/60 hover:bg-sand-pale hover:text-charcoal"
                )}
              >
                {tab === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-4 text-sm leading-6 text-charcoal/60">Checking for notifications...</p>
            ) : visibleNotifications.length > 0 ? (
              <div className="divide-y divide-sand/70">
                {visibleNotifications.map((notification) => {
                  const unread = !notification.read_at;
                  return (
                    <button
                      key={notification.notification_id}
                      type="button"
                      onClick={() => void markRead(notification.notification_id)}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-sand-pale/70"
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-2 h-2 w-2 shrink-0 rounded-full",
                            unread ? "bg-[#0B5C6C]" : "bg-transparent"
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-sm font-semibold leading-6 text-[#0B2A3C]">{notification.title}</span>
                            <time className="shrink-0 text-xs leading-6 text-charcoal/45" dateTime={notification.created_at}>
                              {formatUpdateDateTime(notification.created_at)}
                            </time>
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-charcoal/70">{notification.message}</span>
                          {notification.request_reference && (
                            <span className="mt-2 block font-mono text-[11px] uppercase tracking-wide text-charcoal/45">
                              Request {notification.request_reference}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-4 text-sm leading-6 text-charcoal/60">
                {activeTab === "unread"
                  ? "You have no unread notifications."
                  : "No notifications yet. Updates about your supply requests will appear here."}
              </p>
            )}
          </div>

          <div className="border-t border-sand bg-white px-4 py-3">
            <Link
              href="/portal/notifications"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-[#0B5C6C] hover:underline"
            >
              See previous notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
