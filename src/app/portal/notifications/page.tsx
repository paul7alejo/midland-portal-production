"use client";

import { useEffect, useMemo, useState } from "react";
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
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<PatientPortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const visibleNotifications = useMemo(() => {
    return activeTab === "unread"
      ? notifications.filter((notification) => !notification.read_at)
      : notifications;
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
        };
        if (!cancelled && res.ok) {
          setToken(idToken);
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        }
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

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
            Updates from Midland Sleep about your supply requests.
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
          ) : visibleNotifications.length > 0 ? (
            <div className="space-y-3">
              {visibleNotifications.map((notification) => {
                const unread = !notification.read_at;
                return (
                  <button
                    key={notification.notification_id}
                    type="button"
                    onClick={() => void markRead(notification.notification_id)}
                    className={cn(
                      "block w-full rounded-lg border p-4 text-left transition-colors",
                      unread
                        ? "border-[#74C0A2]/50 bg-[#EFF5F4]"
                        : "border-sand bg-[#F5F3EE] hover:bg-sand-pale"
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
                          <span className="text-lg font-semibold leading-7 text-[#0B2A3C]">
                            {notification.title}
                          </span>
                          <time className="text-sm leading-6 text-charcoal/55" dateTime={notification.created_at}>
                            {formatUpdateDateTime(notification.created_at)}
                          </time>
                        </span>
                        <span className="mt-1 block text-base leading-6 text-charcoal/75">
                          {notification.message}
                        </span>
                        {notification.request_reference && (
                          <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-charcoal/55">
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
