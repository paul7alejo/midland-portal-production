"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";

type NotificationTab = "all" | "unread";
const REQUEST_STATUS_DESTINATION = "/portal/dashboard#supply-request-status";

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

interface PatientNotice {
  noticeId: string;
  title: string;
  message: string;
  placement: string;
  priority: string;
  publishedAt: string;
  expiresAt?: string;
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<PatientPortalNotification[]>([]);
  const [bellNotices, setBellNotices] = useState<PatientNotice[]>([]);
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

        const [notifRes, noticesRes] = await Promise.all([
          fetch("/api/patient/notifications", {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch("/api/patient/notices", {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        const notifData = await notifRes.json().catch(() => ({})) as {
          notifications?: PatientPortalNotification[];
          unreadCount?: number;
        };
        const noticesData = await noticesRes.json().catch(() => ({})) as {
          notices?: PatientNotice[];
        };

        if (!cancelled) {
          if (notifRes.ok) {
            const safeNotifications = Array.isArray(notifData.notifications) ? notifData.notifications : [];
            setToken(idToken);
            setNotifications(safeNotifications);
            setUnreadCount(typeof notifData.unreadCount === "number"
              ? notifData.unreadCount
              : safeNotifications.filter((n) => !n.read_at).length);
          }
          if (noticesRes.ok) {
            const raw = Array.isArray(noticesData.notices) ? noticesData.notices : [];
            setBellNotices(raw.filter((n) => n.placement === "notification_bell"));
          }
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
      if (!res.ok) throw new Error("Unable to mark notification read.");
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

  async function handleNotificationClick(notification: PatientPortalNotification) {
    try {
      if (!notification.read_at) {
        await markRead(notification.notification_id);
      }
    } finally {
      setOpen(false);
      router.push(REQUEST_STATUS_DESTINATION);
    }
  }

  const hasItems = visibleNotifications.length > 0 || (activeTab === "all" && bellNotices.length > 0);

  function NotificationList({ mobile }: { mobile: boolean }) {
    const px = mobile ? "px-5 py-4" : "px-4 py-3";
    const textSm = mobile ? "text-sm" : "text-sm";
    return (
      <>
        {loading ? (
          <p className={cn(px, textSm, "leading-6 text-charcoal/60")}>Checking for notifications...</p>
        ) : hasItems ? (
          <div className="divide-y divide-sand/70">
            {visibleNotifications.map((notification) => {
              const unread = !notification.read_at;
              return (
                <button
                  key={notification.notification_id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={cn("block w-full text-left transition-colors hover:bg-sand-pale/70", mobile ? "px-5 py-4" : "px-4 py-3")}
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
                      <span className={cn("flex items-start justify-between gap-3", mobile && "flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3")}>
                        <span className="text-sm font-semibold leading-6 text-[#0B2A3C]">{notification.title}</span>
                        <time className={cn("text-xs leading-6 text-charcoal/45", mobile && "sm:shrink-0")} dateTime={notification.created_at}>
                          {formatUpdateDateTime(notification.created_at)}
                        </time>
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-charcoal/70">{notification.message}</span>
                      {notification.request_reference && (
                        <span className={cn("mt-2 block font-mono text-[11px] uppercase tracking-wide text-charcoal/45", mobile && "break-all")}>
                          Request {notification.request_reference}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
            {activeTab === "all" && bellNotices.map((notice) => (
              <button
                key={notice.noticeId}
                type="button"
                onClick={() => setOpen(false)}
                className={cn("block w-full text-left transition-colors hover:bg-sand-pale/70", mobile ? "px-5 py-4" : "px-4 py-3")}
              >
                <span className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-transparent" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("flex items-start justify-between gap-3", mobile && "flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3")}>
                      <span className="text-sm font-semibold leading-6 text-[#0B2A3C]">{notice.title}</span>
                      <time className={cn("text-xs leading-6 text-charcoal/45", mobile && "sm:shrink-0")} dateTime={notice.publishedAt}>
                        {formatUpdateDateTime(notice.publishedAt)}
                      </time>
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-charcoal/70">{notice.message}</span>
                    <span className="mt-2 inline-block rounded-full bg-[#EFF5F4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0B5C6C]">
                      Clinic notice
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className={cn(px, textSm, "leading-6 text-charcoal/60")}>
            {activeTab === "unread"
              ? "You have no unread notifications."
              : "No notifications yet. Updates about your supply requests will appear here."}
          </p>
        )}
      </>
    );
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
        <div className="absolute right-0 top-full z-[110] mt-2 hidden w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-sand bg-white shadow-xl lg:block">
          <div className="border-b border-sand bg-sand-pale/60 px-4 py-3">
            <p className="text-sm font-semibold text-charcoal">Notifications</p>
            <p className="mt-0.5 text-xs leading-5 text-charcoal/60">
              Updates and notices from Midland Sleep.
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
            <NotificationList mobile={false} />
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

      {open && (
        <div
          className="fixed inset-0 z-[220] flex items-end bg-navy/45 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative z-10 flex max-h-[75dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-sand bg-white shadow-2xl md:mx-auto md:mb-6 md:max-w-xl md:rounded-2xl">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-sand lg:hidden" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4 border-b border-sand bg-sand-pale/60 px-5 py-4">
              <div className="min-w-0">
                <p className="text-base font-semibold text-charcoal">Notifications</p>
                <p className="mt-1 text-sm leading-5 text-charcoal/65">
                  Updates and notices from Midland Sleep.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-xl text-charcoal/55 transition-colors hover:bg-white hover:text-charcoal"
                aria-label="Close notifications"
              >
                ×
              </button>
            </div>

            <div className="flex border-b border-sand bg-white px-3 py-2">
              {(["all", "unread"] as NotificationTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "min-h-[44px] rounded-lg px-4 text-sm font-semibold transition-colors",
                    activeTab === tab
                      ? "bg-[#EFF5F4] text-[#0B5C6C]"
                      : "text-charcoal/60 hover:bg-sand-pale hover:text-charcoal"
                  )}
                >
                  {tab === "all" ? "All" : "Unread"}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <NotificationList mobile={true} />
            </div>

            <div className="shrink-0 border-t border-sand bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Link
                href="/portal/notifications"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#0B5C6C] hover:underline"
              >
                See previous notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
