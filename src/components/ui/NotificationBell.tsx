"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, PackagePlus } from "lucide-react";
import { API_URL } from "../../lib/config";
import { useAuthToken } from "../../hooks/useAuthToken";

interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: { link?: string; productId?: number } | null;
}

const POLL_MS = 60_000;

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Only internal admin paths are followed -- the link comes from server data.
function safeLink(n: AdminNotification) {
  const link = n.data?.link;
  return typeof link === "string" && link.startsWith("/dashboard") ? link : null;
}

export default function NotificationBell({ size = 24 }: { size?: number }) {
  const token = useAuthToken();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const loadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/unread-count`, { headers: authHeaders() });
      if (!res.ok) return;
      const body = await res.json();
      setUnread(Number(body?.data?.unreadCount) || 0);
    } catch {
      /* keep the last known count */
    }
  }, [token, authHeaders]);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`${API_URL}/api/notifications?limit=15`, { headers: authHeaders() });
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      setItems(body?.data?.notifications ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  // Poll the unread count; refresh as soon as the tab regains focus.
  useEffect(() => {
    if (!token) return;
    loadCount();
    const id = window.setInterval(loadCount, POLL_MS);
    const onFocus = () => loadCount();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, loadCount]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = async (n: AdminNotification) => {
    if (n.isRead) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    setUnread((c) => Math.max(0, c - 1));
    fetch(`${API_URL}/api/notifications/${n.id}/read`, { method: "PUT", headers: authHeaders() }).catch(() => {});
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    fetch(`${API_URL}/api/notifications/mark-all-read`, { method: "PUT", headers: authHeaders() }).catch(() => {});
  };

  const onItemClick = (n: AdminNotification) => {
    markRead(n);
    const link = safeLink(n);
    if (link) {
      setOpen(false);
      router.push(link);
    }
  };

  const badge = unread > 99 ? "99+" : String(unread);

  return (
    <div ref={wrapRef} className="relative flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex cursor-pointer rounded-full p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#037F44]"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={size} color={open ? "#037F44" : "#848484"} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E5484D] text-white text-[10px] font-bold leading-[18px] text-center tabular-nums ring-2 ring-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[76px] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[380px] bg-white rounded-xl border border-[#eceef2] shadow-[0_12px_40px_rgba(16,24,40,0.14)] z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f1f4]">
            <p className="text-[15px] font-semibold text-[#353535]">Notifications</p>
            {items.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[12px] font-medium text-[#037F44] hover:underline"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(70vh,440px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#848484]">Loading…</p>
            ) : failed && items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#848484]">
                Couldn&apos;t load notifications.{" "}
                <button type="button" onClick={loadList} className="text-[#037F44] font-medium hover:underline">
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={22} className="mx-auto mb-2 text-[#c0c4cc]" />
                <p className="text-sm text-[#848484]">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#f3f4f6]">
                {items.map((n) => {
                  const link = safeLink(n);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onItemClick(n)}
                        className={`w-full text-left flex gap-3 px-4 py-3 transition hover:bg-[#F7F8FB] ${
                          n.isRead ? "" : "bg-[#f2fbf6]"
                        } ${link ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-[#e6f9f0] text-[#037F44] flex items-center justify-center">
                          {n.type === "admin_listing_pending" ? <PackagePlus size={16} /> : <Bell size={15} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`text-[13px] leading-snug text-[#353535] ${n.isRead ? "font-medium" : "font-semibold"}`}>
                              {n.title}
                            </span>
                            {!n.isRead && <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-[#037F44]" aria-label="Unread" />}
                          </span>
                          <span className="block mt-0.5 text-[12.5px] leading-snug text-[#6b6b6b] break-words">{n.message}</span>
                          <span className="block mt-1 text-[11px] text-[#a0a4ab]">
                            {timeAgo(n.createdAt)}
                            {link && <span className="text-[#037F44] font-medium"> · Review</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
