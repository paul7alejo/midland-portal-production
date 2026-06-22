"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { configureCognito, getIdToken } from "@/lib/aws/cognito";
import { cn } from "@/lib/utils";

type NotificationTab = "all" | "unread";
const REQUEST_STATUS_DESTINATION = "/portal/dashboard#supply-request-status";

const NOTICE_PRIORITY_BG: Record<string, string> = {
  important: "bg-red-50",
  reminder:  "bg-amber-50",
  info:      "bg-[#EFF5F4]",
};
const NOTICE_PRIORITY_PILL: Record<string, string> = {
  important: "bg-red-100 text-red-700",
  reminder:  "bg-amber-100 text-amber-700",
  info:      "bg-[#D0EAE5] text-[#0B5C6C]",
};
const NOTICE_PRIORITY_LABEL: Record<string, string> = {
  important: "Important",
  reminder:  "Reminder",
  info:      "Info",
};

interface PatientPortalNotification {
  notification_id: string;
  request_reference?: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  channel: "portal";
  delivery_status: "visible";
  link_target?: string;
}

// Only ever navigate to a known portal page — defense in depth even though
// link_target is always set server-side by trusted admin-approval code.
function resolveNotificationDestination(notification: PatientPortalNotification): string {
  if (notification.link_target?.startsWith("/portal/")) return notification.link_target;
  return REQUEST_STATUS_DESTINATION;
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

type AllTabItem =
  | { kind: "notification"; data: PatientPortalNotification; sortKey: string }
  | { kind: "notice";       data: PatientNotice;             sortKey: string };

function formatUpdateDateTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<PatientPortalNotification[]>([]);
  const [clinicNotices, setClinicNotices] = useState<PatientNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        configureCognito();
        const idToken = await getIdToken();
        if (!idToken) throw new Error("Session expired.");

        const [notifRes, noticesRes] = await Promise.all([
          fetch("/api/patient/notifications", { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch("/api/patient/notices",       { headers: { Authorization: `Bearer ${idToken}` } }),
        ]);

        const notifData = await notifRes.json().catch(() => ({})) as {
          notifications?: PatientPortalNotification[];
        };
        const noticesData = await noticesRes.json().catch(() => ({})) as {
          notices?: PatientNotice[];
        };

        if (!cancelled) {
          if (notifRes.ok) {
            setToken(idToken);
            setNotifications(Array.isArray(notifData.notifications) ? notifData.notifications : []);
          }
          if (noticesRes.ok) {
            setClinicNotices(
              (Array.isArray(noticesData.notices) ? noticesData.notices : [])
                .filter((n) => n.placement === "notification_bell")
            );
          }
        }
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  const allItems = useMemo((): AllTabItem[] => {
    const notifItems: AllTabItem[] = notifications.map((n) => ({
      kind: "notification",
      data: n,
      sortKey: n.created_at,
    }));
    const noticeItems: AllTabItem[] = clinicNotices.map((n) => ({
      kind: "notice",
      data: n,
      sortKey: n.publishedAt,
    }));
    return [...notifItems, ...noticeItems].sort((a, b) =>
      b.sortKey.localeCompare(a.sortKey)
    );
  }, [notifications, clinicNotices]);

  const visibleItems = activeTab === "unread"
    ? notifications.filter((n) => !n.read_at)
    : allItems;

  async function markRead(notificationId: string) {
    const target = notifications.find((n) => n.notification_id === notificationId);
    if (!target || target.read_at) return;

    const optimisticReadAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((n) =>
        n.notification_id === notificationId ? { ...n, read_at: optimisticReadAt } : n
      )
    );

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
          current.map((n) =>
            n.notification_id === notificationId ? data.notification! : n
          )
        );
      }
    } catch {
      setNotifications((current) =>
        current.map((n) =>
          n.notification_id === notificationId
            ? { ...n, read_at: target.read_at }
            : n
        )
      );
    }
  }

  async function handleNotificationClick(notification: PatientPortalNotification) {
    try {
      if (!notification.read_at) await markRead(notification.notification_id);
    } finally {
      router.push(resolveNotificationDestination(notification));
    }
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 lg:w-[calc(100vw-18rem)]">
      <section className="rounded-xl border border-[#E6D3A3] bg-white p-5 shadow-sm md:p-6">
        <div className="border-b border-[#E6D3A3] pb-4">
          <h1 className="font-display text-[34px] font-semibold leading-tight text-[#0B2A3C] md:text-[42px]">
            Notifications
          </h1>
          <p className="mt-2 text-lg leading-7 text-charcoal/75">
            Updates and notices from Midland Sleep.
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          {(["all", "unread"] as NotificationTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-4 py-2 text-base font-semibold transition-colors",
                activeTab === tab
                  ? "bg-[#EFF5F4] text-[#0B5C6C]"
                  : "border border-sand bg-white text-charcoal/65 hover:bg-sand-pale hover:text-charcoal"
              )}
            >
              {tab === "all" ? "All" : "Unread"}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {loading ? (
            <p className="rounded-lg border border-sand bg-[#F5F3EE] p-5 text-base leading-7 text-charcoal/70">
              Checking for notifications...
            </p>
          ) : visibleItems.length > 0 ? (
            <div className="space-y-3">
              {activeTab === "unread"
                ? (visibleItems as PatientPortalNotification[]).map((notification) => {
                    const unread = !notification.read_at;
                    return (
                      <button
                        key={notification.notification_id}
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
                        className={cn(
                          "block w-full rounded-lg border p-4 text-left transition-colors",
                          unread ? "border-[#74C0A2]/50 bg-[#EFF5F4]" : "border-sand bg-[#F5F3EE] hover:bg-sand-pale"
                        )}
                      >
                        <span className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0B5C6C]" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-start justify-between gap-2">
                              <span className="text-lg font-semibold leading-7 text-[#0B2A3C]">{notification.title}</span>
                              <time className="text-sm leading-6 text-charcoal/55" dateTime={notification.created_at}>
                                {formatUpdateDateTime(notification.created_at)}
                              </time>
                            </span>
                            <span className="mt-1 block text-base leading-6 text-charcoal/75">{notification.message}</span>
                            {notification.request_reference && (
                              <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-charcoal/55">
                                Request {notification.request_reference}
                              </span>
                            )}
                            {notification.link_target?.startsWith("/portal/profile") && (
                              <span className="mt-3 block text-sm font-semibold text-[#0B5C6C]">
                                View profile →
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })
                : (visibleItems as AllTabItem[]).map((item) => {
                    if (item.kind === "notification") {
                      const notification = item.data;
                      const unread = !notification.read_at;
                      return (
                        <button
                          key={notification.notification_id}
                          type="button"
                          onClick={() => void handleNotificationClick(notification)}
                          className={cn(
                            "block w-full rounded-lg border p-4 text-left transition-colors",
                            unread ? "border-[#74C0A2]/50 bg-[#EFF5F4]" : "border-sand bg-[#F5F3EE] hover:bg-sand-pale"
                          )}
                        >
                          <span className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-2 h-2.5 w-2.5 shrink-0 rounded-full",
                                unread ? "bg-[#0B5C6C]" : "bg-transparent"
                              )}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-start justify-between gap-2">
                                <span className="text-lg font-semibold leading-7 text-[#0B2A3C]">{notification.title}</span>
                                <time className="text-sm leading-6 text-charcoal/55" dateTime={notification.created_at}>
                                  {formatUpdateDateTime(notification.created_at)}
                                </time>
                              </span>
                              <span className="mt-1 block text-base leading-6 text-charcoal/75">{notification.message}</span>
                              {notification.request_reference && (
                                <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-charcoal/55">
                                  Request {notification.request_reference}
                                </span>
                              )}
                              {notification.link_target?.startsWith("/portal/profile") && (
                                <span className="mt-3 block text-sm font-semibold text-[#0B5C6C]">
                                  View profile →
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    }

                    const notice = item.data;
                    return (
                      <div
                        key={notice.noticeId}
                        className={cn("rounded-lg border border-sand p-4", NOTICE_PRIORITY_BG[notice.priority] ?? NOTICE_PRIORITY_BG.info)}
                      >
                        <span className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-transparent" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-start justify-between gap-2">
                              <span className="text-lg font-semibold leading-7 text-[#0B2A3C]">{notice.title}</span>
                              <time className="text-sm leading-6 text-charcoal/55" dateTime={notice.publishedAt}>
                                {formatUpdateDateTime(notice.publishedAt)}
                              </time>
                            </span>
                            <span className="mt-1 block text-base leading-6 text-charcoal/75">{notice.message}</span>
                            <span className={cn("mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", NOTICE_PRIORITY_PILL[notice.priority] ?? NOTICE_PRIORITY_PILL.info)}>
                              {NOTICE_PRIORITY_LABEL[notice.priority] ?? "Info"}
                            </span>{" "}
                            <span className="mt-3 inline-block rounded-full bg-[#EFF5F4] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#0B5C6C]">
                              Clinic notice
                            </span>
                          </span>
                        </span>
                      </div>
                    );
                  })}
            </div>
          ) : (
            <p className="rounded-lg border border-sand bg-[#F5F3EE] p-5 text-base leading-7 text-charcoal/70">
              {activeTab === "unread"
                ? "You have no unread notifications."
                : "No notifications yet. Updates about your supply requests will appear here."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
