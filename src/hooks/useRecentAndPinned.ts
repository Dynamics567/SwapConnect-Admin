"use client";
import { useCallback, useEffect, useState } from "react";

const RECENT_KEY = "swapconnect_admin_recent_pages";
const PINNED_KEY = "swapconnect_admin_pinned_pages";
const MAX_RECENT = 5;

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private browsing, etc.) -- fail silently,
    // pinning/recent is a convenience, not a feature anything depends on.
  }
}

// Both pinned pages and recently-visited pages are pure client-side
// convenience state -- no backend involved, no account sync. `id` is a
// FlatNavItem.id (the page's url) from src/lib/navIndex.ts.
export function useRecentAndPinned() {
  const [recent, setRecent] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readList(RECENT_KEY));
    setPinned(readList(PINNED_KEY));
  }, []);

  const recordVisit = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
      writeList(RECENT_KEY, next);
      return next;
    });
  }, []);

  const togglePinned = useCallback((id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeList(PINNED_KEY, next);
      return next;
    });
  }, []);

  return { recent, pinned, recordVisit, togglePinned };
}
