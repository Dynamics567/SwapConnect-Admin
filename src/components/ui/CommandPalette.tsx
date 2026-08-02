"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Star, CornerDownLeft, X, UserRound, Gavel, Tag as TagIcon } from "lucide-react";
import { flatNavItems, type FlatNavItem } from "@/lib/navIndex";
import { useRole } from "@/hooks/useRole";
import { useRecentAndPinned } from "@/hooks/useRecentAndPinned";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";

// Global page-jump + record-jump search (Ctrl+K / Cmd+K), per
// docs/NAVIGATION_ROADMAP.md Phase 4. Page search is pure client-side
// (flatNavItems); record search (users/disputes/coupons) hits
// GET /api/admin/search. Orders are deliberately not searchable here --
// there is no order detail page anywhere in the admin app, so a result
// would link to nothing real.

interface SearchRecord {
  id: number;
  label: string;
  sub?: string;
  tag?: string;
}
interface RecordResults {
  users: SearchRecord[];
  disputes: SearchRecord[];
  coupons: SearchRecord[];
}
const EMPTY_RECORDS: RecordResults = { users: [], disputes: [], coupons: [] };

function recordUrl(type: keyof RecordResults, record: SearchRecord): string {
  if (type === "users") return `/dashboard/user/${record.id}`;
  if (type === "disputes") return `/dashboard/disputes?id=${record.id}`;
  return `/dashboard/coupons?code=${encodeURIComponent(record.label)}`;
}

const RECORD_ICON: Record<keyof RecordResults, typeof UserRound> = {
  users: UserRound,
  disputes: Gavel,
  coupons: TagIcon,
};
const RECORD_SECTION_TITLE: Record<keyof RecordResults, string> = {
  users: "Users",
  disputes: "Disputes",
  coupons: "Coupons",
};

export default function CommandPalette() {
  const { role } = useRole();
  const pathname = usePathname();
  const token = useAuthToken();
  const { recent, pinned, recordVisit, togglePinned } = useRecentAndPinned();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [records, setRecords] = useState<RecordResults>(EMPTY_RECORDS);
  const [recordsLoading, setRecordsLoading] = useState(false);
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
      setRecords(EMPTY_RECORDS);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Debounced record search -- separate from the instant client-side page
  // filter below, since this one is a real network call.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || !token) {
      setRecords(EMPTY_RECORDS);
      return;
    }
    setRecordsLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data.data ?? EMPTY_RECORDS);
        }
      } catch {
        // record search is advisory -- page search below still works offline
      } finally {
        setRecordsLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, token]);

  const visiblePages = useMemo(
    () => (role ? flatNavItems.filter((item) => item.roles.includes(role)) : flatNavItems),
    [role]
  );

  const pageResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visiblePages;
    return visiblePages.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, visiblePages]);

  const pinnedItems = useMemo(
    () => pinned.map((id) => visiblePages.find((i) => i.id === id)).filter(Boolean) as FlatNavItem[],
    [pinned, visiblePages]
  );
  const recentItems = useMemo(
    () =>
      recent
        .filter((id) => !pinned.includes(id))
        .map((id) => visiblePages.find((i) => i.id === id))
        .filter(Boolean) as FlatNavItem[],
    [recent, pinned, visiblePages]
  );

  const showingBrowse = query.trim().length === 0;

  // One flat, ordered list drives keyboard navigation across every section
  // (browse: pinned then recent; search: pages then each record type) so
  // arrow keys/Enter work uniformly regardless of which section it's in.
  type Selectable =
    | { kind: "page"; item: FlatNavItem }
    | { kind: "record"; type: keyof RecordResults; record: SearchRecord };

  const flatSelectable: Selectable[] = useMemo(() => {
    if (showingBrowse) {
      return [
        ...pinnedItems.map((item): Selectable => ({ kind: "page", item })),
        ...recentItems.map((item): Selectable => ({ kind: "page", item })),
      ];
    }
    const recordItems: Selectable[] = (["users", "disputes", "coupons"] as const).flatMap((type) =>
      records[type].map((record): Selectable => ({ kind: "record", type, record }))
    );
    return [...pageResults.map((item): Selectable => ({ kind: "page", item })), ...recordItems];
  }, [showingBrowse, pinnedItems, recentItems, pageResults, records]);

  useEffect(() => setHighlighted(0), [query]);

  const goToPage = (item: FlatNavItem) => {
    recordVisit(item.id);
    window.location.href = item.url;
  };
  const goToRecord = (type: keyof RecordResults, record: SearchRecord) => {
    window.location.href = recordUrl(type, record);
  };
  const selectItem = (sel: Selectable) => (sel.kind === "page" ? goToPage(sel.item) : goToRecord(sel.type, sel.record));

  if (!isOpen) return null;

  const hasAnyRecords = records.users.length + records.disputes.length + records.coupons.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-start justify-center pt-[12vh] px-4" onClick={() => setIsOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eee]">
          <Search size={18} className="text-[#848484] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((h) => Math.min(h + 1, flatSelectable.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter" && flatSelectable[highlighted]) {
                selectItem(flatSelectable[highlighted]);
              }
            }}
            placeholder="Search pages, users, disputes, coupons…"
            className="flex-1 text-[15px] outline-none placeholder:text-[#c0c0c0]"
          />
          <button onClick={() => setIsOpen(false)} aria-label="Close" className="text-[#848484] hover:text-[#353535]">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-2">
          {showingBrowse ? (
            <>
              {pinnedItems.length > 0 && (
                <Section title="Pinned">
                  {pinnedItems.map((item, i) => (
                    <PageRow
                      key={item.id}
                      item={item}
                      isPinned
                      isHighlighted={flatSelectable[highlighted]?.kind === "page" && flatSelectable[highlighted]?.item.id === item.id}
                      onSelect={() => goToPage(item)}
                      onTogglePin={() => togglePinned(item.id)}
                    />
                  ))}
                </Section>
              )}
              {recentItems.length > 0 && (
                <Section title="Recently visited">
                  {recentItems.map((item) => (
                    <PageRow
                      key={item.id}
                      item={item}
                      isPinned={pinned.includes(item.id)}
                      isHighlighted={flatSelectable[highlighted]?.kind === "page" && flatSelectable[highlighted]?.item.id === item.id}
                      onSelect={() => goToPage(item)}
                      onTogglePin={() => togglePinned(item.id)}
                    />
                  ))}
                </Section>
              )}
              {pinnedItems.length === 0 && recentItems.length === 0 && (
                <p className="text-sm text-[#c0c0c0] text-center py-8">Start typing to search pages, users, disputes, or coupons…</p>
              )}
            </>
          ) : (
            <>
              {pageResults.length > 0 && (
                <Section title={`Pages`}>
                  {pageResults.map((item) => (
                    <PageRow
                      key={item.id}
                      item={item}
                      isPinned={pinned.includes(item.id)}
                      isHighlighted={flatSelectable[highlighted]?.kind === "page" && flatSelectable[highlighted]?.item.id === item.id}
                      onSelect={() => goToPage(item)}
                      onTogglePin={() => togglePinned(item.id)}
                    />
                  ))}
                </Section>
              )}
              {(["users", "disputes", "coupons"] as const).map((type) =>
                records[type].length > 0 ? (
                  <Section key={type} title={RECORD_SECTION_TITLE[type]}>
                    {records[type].map((record) => (
                      <RecordRow
                        key={`${type}-${record.id}`}
                        type={type}
                        record={record}
                        isHighlighted={
                          flatSelectable[highlighted]?.kind === "record" &&
                          flatSelectable[highlighted]?.type === type &&
                          flatSelectable[highlighted]?.record.id === record.id
                        }
                        onSelect={() => goToRecord(type, record)}
                      />
                    ))}
                  </Section>
                ) : null
              )}
              {pageResults.length === 0 && !hasAnyRecords && (
                <p className="text-sm text-[#c0c0c0] text-center py-8">
                  {recordsLoading ? "Searching…" : `No matches for "${query}"`}
                </p>
              )}
            </>
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

function PageRow({
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

function RecordRow({
  type,
  record,
  isHighlighted,
  onSelect,
}: {
  type: keyof RecordResults;
  record: SearchRecord;
  isHighlighted: boolean;
  onSelect: () => void;
}) {
  const Icon = RECORD_ICON[type];
  return (
    <button
      onClick={onSelect}
      className={`flex items-center w-full gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
        isHighlighted ? "bg-[#F7F8FB]" : "hover:bg-[#F7F8FB]"
      }`}
    >
      <Icon size={16} className="text-[#037F44] shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[#353535] truncate">{record.label}</span>
        {record.sub && <span className="block text-[11px] text-[#c0c0c0] truncate">{record.sub}</span>}
      </span>
      {record.tag && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#037F44] bg-[#e6f9f0] px-2 py-0.5 rounded-full shrink-0">
          {record.tag}
        </span>
      )}
    </button>
  );
}
