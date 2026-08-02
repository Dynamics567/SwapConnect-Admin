"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Star, CornerDownLeft, X } from "lucide-react";
import { flatNavItems, type FlatNavItem } from "@/lib/navIndex";
import { useRole } from "@/hooks/useRole";
import { useRecentAndPinned } from "@/hooks/useRecentAndPinned";

// Global page-jump search (Ctrl+K / Cmd+K), per docs/NAVIGATION_ROADMAP.md
// Phase 4. Deliberately page-level only -- jumping to a specific record
// (a user, an order, a dispute) is a separate "global search" the roadmap
// calls out as needing its own backend search endpoints, not this palette.
export default function CommandPalette() {
  const { role } = useRole();
  const pathname = usePathname();
  const { recent, pinned, recordVisit, togglePinned } = useRecentAndPinned();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Record every real navigation as "recently visited", not just ones made
  // through this palette -- sidebar clicks and direct URLs count too.
  useEffect(() => {
    if (!pathname) return;
    const match = flatNavItems.find((item) => item.url.split("?")[0] === pathname);
    if (match) recordVisit(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    const onOpenRequest = () => setIsOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-admin-command-palette", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-admin-command-palette", onOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const visibleItems = useMemo(
    () => (role ? flatNavItems.filter((item) => item.roles.includes(role)) : flatNavItems),
    [role]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, visibleItems]);

  const pinnedItems = useMemo(
    () => pinned.map((id) => visibleItems.find((i) => i.id === id)).filter(Boolean) as FlatNavItem[],
    [pinned, visibleItems]
  );
  const recentItems = useMemo(
    () =>
      recent
        .filter((id) => !pinned.includes(id))
        .map((id) => visibleItems.find((i) => i.id === id))
        .filter(Boolean) as FlatNavItem[],
    [recent, pinned, visibleItems]
  );

  const goTo = (item: FlatNavItem) => {
    recordVisit(item.id);
    window.location.href = item.url;
  };

  useEffect(() => setHighlighted(0), [query]);

  if (!isOpen) return null;

  const showingBrowse = query.trim().length === 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[300] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eee]">
          <Search size={18} className="text-[#848484] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter" && results[highlighted]) {
                goTo(results[highlighted]);
              }
            }}
            placeholder="Search pages… (e.g. coupons, disputes, reports)"
            className="flex-1 text-[15px] outline-none placeholder:text-[#c0c0c0]"
          />
          <button onClick={() => setIsOpen(false)} aria-label="Close" className="text-[#848484] hover:text-[#353535]">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto py-2">
          {showingBrowse ? (
            <>
              {pinnedItems.length > 0 && (
                <Section title="Pinned">
                  {pinnedItems.map((item, i) => (
                    <Row
                      key={item.id}
                      item={item}
                      isPinned
                      isHighlighted={i === highlighted}
                      onSelect={() => goTo(item)}
                      onTogglePin={() => togglePinned(item.id)}
                    />
                  ))}
                </Section>
              )}
              {recentItems.length > 0 && (
                <Section title="Recently visited">
                  {recentItems.map((item, i) => (
                    <Row
                      key={item.id}
                      item={item}
                      isPinned={pinned.includes(item.id)}
                      isHighlighted={pinnedItems.length + i === highlighted}
                      onSelect={() => goTo(item)}
                      onTogglePin={() => togglePinned(item.id)}
                    />
                  ))}
                </Section>
              )}
              {pinnedItems.length === 0 && recentItems.length === 0 && (
                <p className="text-sm text-[#c0c0c0] text-center py-8">Start typing to search every page…</p>
              )}
            </>
          ) : results.length === 0 ? (
            <p className="text-sm text-[#c0c0c0] text-center py-8">No pages match &quot;{query}&quot;</p>
          ) : (
            <Section title={`${results.length} result${results.length === 1 ? "" : "s"}`}>
              {results.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  isPinned={pinned.includes(item.id)}
                  isHighlighted={i === highlighted}
                  onSelect={() => goTo(item)}
                  onTogglePin={() => togglePinned(item.id)}
                />
              ))}
            </Section>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#eee] text-[11px] text-[#c0c0c0]">
          <span className="flex items-center gap-1"><CornerDownLeft size={12} /> to open</span>
          <span>↑↓ to navigate</span>
          <span className="ml-auto">Esc to close</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c0c0c0]">{title}</p>
      {children}
    </div>
  );
}

function Row({
  item,
  isPinned,
  isHighlighted,
  onSelect,
  onTogglePin,
}: {
  item: FlatNavItem;
  isPinned: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center w-full gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
        isHighlighted ? "bg-[#F7F8FB]" : "hover:bg-[#F7F8FB]"
      }`}
    >
      <item.icon size={16} className="text-[#037F44] shrink-0" />
      <span className="flex-1 text-[#353535] truncate">{item.label}</span>
      <span
        role="button"
        tabIndex={0}
        aria-label={isPinned ? "Unpin page" : "Pin page"}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        className="text-[#c0c0c0] hover:text-[#d7a825] shrink-0"
      >
        <Star size={15} fill={isPinned ? "#d7a825" : "none"} color={isPinned ? "#d7a825" : "currentColor"} />
      </span>
    </button>
  );
}
