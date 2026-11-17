"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Package, Search, Check, X } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Sheet, Field, INPUT, Pill } from "./Sheet";
import { api, BTN, fmtDate } from "./campaignLabels";

// Prize items (Give listings linked to the campaign) and entries (people
// taking part) for one campaign, in the admin campaign detail panel.

interface ListingBrief {
  id: number;
  state: string;
  Product: { id: number; name: string; imageUrl: string | null; brand: string | null; condition: string | null } | null;
}
interface Item {
  id: number;
  position: number;
  giveListingId: number;
  listing: ListingBrief | null;
}
interface Entry {
  id: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "SELECTED";
  source: string;
  externalParticipantId: string | null;
  answers: Record<string, string>;
  reviewNote: string | null;
  createdAt: string;
  participant: { id?: number; name: string; email?: string; phone?: string | null } | null;
}
type Summary = Record<Entry["status"] | "total", number>;

const LISTING_STATE: Record<string, { label: string; cls: string }> = {
  SUBMITTED: { label: "Awaiting Give verification", cls: "bg-[#fef6e4] text-[#9a6b0f]" },
  AVAILABLE: { label: "Available", cls: "bg-[#e6f9f0] text-[#037F44]" },
  MATCHED: { label: "Matched", cls: "bg-[#eaf2fd] text-[#1e5bb8]" },
  ALLOCATED: { label: "Allocated", cls: "bg-[#eaf2fd] text-[#1e5bb8]" },
  IN_FULFILMENT: { label: "Being delivered", cls: "bg-[#eaf2fd] text-[#1e5bb8]" },
  COMPLETED: { label: "Delivered", cls: "bg-[#f1f2f4] text-[#5f6672]" },
  REJECTED: { label: "Rejected by Give", cls: "bg-[#fdecec] text-[#b42318]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#fdecec] text-[#b42318]" },
};
const ENTRY_STATUS: Record<Entry["status"], { label: string; cls: string }> = {
  SUBMITTED: { label: "To review", cls: "bg-[#fef6e4] text-[#9a6b0f]" },
  APPROVED: { label: "Accepted", cls: "bg-[#e6f9f0] text-[#037F44]" },
  REJECTED: { label: "Rejected", cls: "bg-[#fdecec] text-[#b42318]" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-[#f1f2f4] text-[#5f6672]" },
  SELECTED: { label: "Winner", cls: "bg-[#eaf2fd] text-[#1e5bb8]" },
};
const ANSWER_LABEL: Record<string, string> = { phone: "Phone", location: "Location", ageBand: "Age", reason: "Reason", externalId: "Participant ID" };
const CLOSED = ["COMPLETED", "ARCHIVED", "CANCELLED"];

function Thumb({ url }: { url?: string | null }) {
  return (
    <span className="h-10 w-10 rounded-lg bg-[#eef1f5] overflow-hidden shrink-0 flex items-center justify-center">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Package size={15} className="text-gray-400" />
      )}
    </span>
  );
}

export default function CampaignPrizesEntries({
  token,
  campaignId,
  campaignStatus,
  participationMode,
  canEdit,
}: {
  token: string | null;
  campaignId: number;
  campaignStatus: string;
  participationMode: string;
  canEdit: boolean;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ListingBrief[] | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);
  const [rejecting, setRejecting] = useState<Entry | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setItems(await api<Item[]>(token, `/campaigns/${campaignId}/items`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token, campaignId]);
  const loadEntries = useCallback(async () => {
    try {
      const out = await api<{ summary: Summary; entries: Entry[] }>(token, `/campaigns/${campaignId}/entries${filter ? `?status=${filter}` : ""}`);
      setEntries(out.entries);
      setSummary(out.summary);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token, campaignId, filter]);

  useEffect(() => {
    if (!token) return;
    setItems(null);
    loadItems();
  }, [token, loadItems]);
  useEffect(() => {
    if (!token) return;
    loadEntries();
  }, [token, loadEntries]);

  useEffect(() => {
    if (!pickerOpen || !token) return;
    const t = setTimeout(() => {
      api<ListingBrief[]>(token, `/give-listings${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`)
        .then(setOptions)
        .catch((e) => toast.error((e as Error).message));
    }, 250);
    return () => clearTimeout(t);
  }, [pickerOpen, search, token]);

  const attach = async (listingId: number) => {
    setBusy(true);
    try {
      await api(token, `/campaigns/${campaignId}/items`, { method: "POST", body: JSON.stringify({ giveListingId: listingId }) });
      toast.success("Prize added");
      setPickerOpen(false);
      setSearch("");
      loadItems();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const detach = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await api(token, `/campaigns/${campaignId}/items/${removing.id}`, { method: "DELETE" });
      toast.success("Prize removed");
      setRemoving(null);
      loadItems();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const review = async (entry: Entry, action: "approve" | "reject", reason?: string) => {
    setBusy(true);
    try {
      await api(token, `/campaigns/${campaignId}/entries/${entry.id}/review`, { method: "POST", body: JSON.stringify({ action, note: reason || undefined }) });
      toast.success(action === "approve" ? "Entry accepted" : "Entry rejected");
      setRejecting(null);
      setNote("");
      loadEntries();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const itemsLocked = !canEdit || CLOSED.includes(campaignStatus);
  const attachedIds = new Set((items || []).map((i) => i.giveListingId));

  return (
    <>
      <section className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">Prize items {items ? `(${items.length})` : ""}</p>
          {!itemsLocked && (
            <button onClick={() => setPickerOpen(true)} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${BTN.secondary}`}>
              <Plus size={13} /> Add from Give
            </button>
          )}
        </div>
        {items === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-gray-500">No prizes yet. Prizes are Give items; list the item through Give first, then add it here.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const st = LISTING_STATE[it.listing?.state || ""] || { label: it.listing?.state || "—", cls: "bg-[#f1f2f4] text-[#5f6672]" };
              return (
                <li key={it.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
                  <Thumb url={it.listing?.Product?.imageUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-gray-800 truncate">{it.listing?.Product?.name || `Give item #${it.giveListingId}`}</span>
                    <span className="block text-[11px] text-gray-500">Give item #{it.giveListingId}</span>
                  </span>
                  <Pill className={st.cls}>{st.label}</Pill>
                  {!itemsLocked && (
                    <button onClick={() => setRemoving(it)} className="p-1.5 text-gray-400 hover:text-[#b42318]" aria-label="Remove prize">
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-700">Entries {summary ? `(${summary.total})` : ""}</p>
          {summary && summary.total > 0 && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
              <option value="">All</option>
              {(Object.keys(ENTRY_STATUS) as Entry["status"][]).map((s) => (
                <option key={s} value={s}>
                  {ENTRY_STATUS[s].label} ({summary[s]})
                </option>
              ))}
            </select>
          )}
        </div>
        {participationMode === "EXTERNAL" ? (
          <p className="text-xs text-gray-500">People take part on the partner&apos;s own platform. The partner confirms the winner, so entries don&apos;t come through SwapConnect.</p>
        ) : entries === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-gray-500">{filter ? "No entries with this status." : "No entries yet. People can enter once the campaign is running."}</p>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {entries.map((e) => (
              <li key={e.id} className="border border-gray-100 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-800">{e.participant?.name || e.externalParticipantId || `Entry #${e.id}`}</span>
                    <span className="block text-[11px] text-gray-500 break-all">
                      {[e.participant?.email, e.participant?.phone].filter(Boolean).join(" · ")}
                      {e.participant?.email || e.participant?.phone ? " · " : ""}entered {fmtDate(e.createdAt)}
                    </span>
                  </span>
                  <Pill className={ENTRY_STATUS[e.status].cls}>{ENTRY_STATUS[e.status].label}</Pill>
                </div>
                {Object.keys(e.answers || {}).length > 0 && (
                  <dl className="mt-1.5 space-y-0.5">
                    {Object.entries(e.answers).map(([k, v]) => (
                      <div key={k} className="flex gap-1.5">
                        <dt className="text-gray-500 shrink-0">{ANSWER_LABEL[k] || k}:</dt>
                        <dd className="text-gray-700 whitespace-pre-wrap break-words">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {e.reviewNote && <p className="mt-1 text-gray-500">Note: {e.reviewNote}</p>}
                {canEdit && ["SUBMITTED", "APPROVED", "REJECTED"].includes(e.status) && (
                  <div className="flex gap-2 mt-2">
                    {e.status !== "APPROVED" && (
                      <button disabled={busy} onClick={() => review(e, "approve")} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60 ${BTN.primary}`}>
                        <Check size={12} /> Accept
                      </button>
                    )}
                    {e.status !== "REJECTED" && (
                      <button disabled={busy} onClick={() => setRejecting(e)} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60 ${BTN.danger}`}>
                        <X size={12} /> Reject
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-gray-400 mt-2">Accepting an entry never awards a prize. Winners are chosen in the next phase.</p>
      </section>

      <Sheet
        open={pickerOpen}
        title="Add a prize from Give"
        onClose={() => setPickerOpen(false)}
        footer={
          <button onClick={() => setPickerOpen(false)} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
            Close
          </button>
        }
      >
        <p className="text-xs text-gray-500">Items waiting for verification or available in Give. Search by name or Give item number.</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Give items" className={`${INPUT} pl-8`} />
        </div>
        {options === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : options.length === 0 ? (
          <p className="text-xs text-gray-500">No matching Give items.</p>
        ) : (
          <ul className="space-y-2">
            {options.map((o) => {
              const st = LISTING_STATE[o.state] || { label: o.state, cls: "" };
              const already = attachedIds.has(o.id);
              return (
                <li key={o.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
                  <Thumb url={o.Product?.imageUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 truncate">{o.Product?.name || `Give item #${o.id}`}</span>
                    <span className="block text-[11px] text-gray-500">
                      #{o.id} · <span className={st.cls ? "" : ""}>{st.label}</span>
                    </span>
                  </span>
                  <button disabled={busy || already} onClick={() => attach(o.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ${BTN.primary}`}>
                    {already ? "Added" : "Add"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>

      <Sheet
        open={!!rejecting}
        title="Reject entry"
        onClose={() => setRejecting(null)}
        footer={
          <>
            <button onClick={() => setRejecting(null)} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Back
            </button>
            <button
              disabled={busy}
              onClick={() => rejecting && (note.trim() ? review(rejecting, "reject", note) : toast.error("Give a reason."))}
              className="text-sm px-4 py-2 rounded-lg font-semibold bg-[#b42318] text-white hover:bg-[#912018] disabled:opacity-60"
            >
              Reject entry
            </button>
          </>
        }
      >
        <Field label="Reason" required hint="The participant sees this reason.">
          <textarea className={`${INPUT} resize-none`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Sheet>

      <ConfirmDialog
        open={!!removing}
        title="Remove this prize?"
        message={`${removing?.listing?.Product?.name || "This item"} stays in Give; it just stops being a prize in this campaign.`}
        confirmLabel="Remove"
        variant="danger"
        loading={busy}
        onConfirm={detach}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}
