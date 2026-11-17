"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Shuffle, Clock, Star, UserCheck, AtSign, Check, X, Package } from "lucide-react";
import { Sheet, Field, INPUT, Pill } from "./Sheet";
import { api, BTN, fmtDate } from "./campaignLabels";

// Winners for one campaign: choose (draw / first come / top score / by hand
// / by account), approve partner-proposed winners, cancel or expire, and
// follow Give delivery progress.

interface Item {
  id: number;
  giveListingId: number;
  listing: { id: number; state: string; Product: { name: string; imageUrl: string | null } | null } | null;
}
interface Award {
  id: number;
  status: "PROPOSED" | "AWAITING_CLAIM" | "ALLOCATED" | "CANCELLED" | "EXPIRED";
  method: string;
  decidedByType: "ADMIN" | "PARTNER" | "SYSTEM";
  evidence: { mode?: string; note?: string | null; url?: string | null; poolSize?: number; pickedIndex?: number; winningScore?: number; override?: boolean };
  claimBy: string | null;
  claimedAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  campaignItemId: number;
  externalParticipantId: string | null;
  winner: { id?: number; name: string; email?: string; phone?: string | null } | null;
  overdue: boolean;
  progress: { fulfilmentStatus: string | null; receiptConfirmed: boolean; deliveredAt: string | null } | null;
}
interface Entry {
  id: number;
  status: string;
  participant: { name: string; email?: string } | null;
  externalParticipantId: string | null;
}

const AWARD_STATUS: Record<Award["status"], { label: string; cls: string }> = {
  PROPOSED: { label: "Needs approval", cls: "bg-[#fef6e4] text-[#9a6b0f]" },
  AWAITING_CLAIM: { label: "Waiting for winner", cls: "bg-[#eaf2fd] text-[#1e5bb8]" },
  ALLOCATED: { label: "With Give for delivery", cls: "bg-[#e6f9f0] text-[#037F44]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#f1f2f4] text-[#5f6672]" },
  EXPIRED: { label: "Expired", cls: "bg-[#fdecec] text-[#b42318]" },
};
const FULFILMENT: Record<string, string> = {
  PENDING_HANDOVER: "Awaiting handover",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  FAILED: "Delivery failed",
};
const MODE_LABEL: Record<string, string> = { DRAW: "Random draw", FIRST_COME: "First come", TOP_SCORE: "Top score", ENTRY: "Picked by hand", ACCOUNT: "Named by account" };

type Mode = "DRAW" | "FIRST_COME" | "TOP_SCORE" | "ENTRY" | "ACCOUNT";
const AUTO_FOR: Record<string, Mode | undefined> = { RANDOM: "DRAW", FIRST_COME: "FIRST_COME", SCORE: "TOP_SCORE" };
const HAND_PICK = ["MANUAL", "ADMIN_APPROVED", "ELIGIBILITY", "PARTNER_CONFIRMED"];

export default function CampaignWinners({
  token,
  campaignId,
  campaignStatus,
  allocationMethod,
  participationMode,
  canEdit,
}: {
  token: string | null;
  campaignId: number;
  campaignStatus: string;
  allocationMethod: string;
  participationMode: string;
  canEdit: boolean;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [awards, setAwards] = useState<Award[] | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [choosing, setChoosing] = useState<Item | null>(null);
  const [mode, setMode] = useState<Mode>("DRAW");
  const [entryId, setEntryId] = useState("");
  const [email, setEmail] = useState("");
  const [externalId, setExternalId] = useState("");
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [ending, setEnding] = useState<{ award: Award; expire: boolean } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [it, aw, en] = await Promise.all([
        api<Item[]>(token, `/campaigns/${campaignId}/items`),
        api<Award[]>(token, `/campaigns/${campaignId}/awards`),
        participationMode === "EXTERNAL" ? Promise.resolve({ entries: [] as Entry[] }) : api<{ entries: Entry[] }>(token, `/campaigns/${campaignId}/entries?status=APPROVED`),
      ]);
      setItems(it);
      setAwards(aw);
      setEntries(en.entries);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token, campaignId, participationMode]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const running = ["ACTIVE", "COMPLETED"].includes(campaignStatus);
  const autoMode = AUTO_FOR[allocationMethod];
  const handPickIsOverride = !HAND_PICK.includes(allocationMethod);

  const openChooser = (item: Item) => {
    setChoosing(item);
    setMode(autoMode || (participationMode === "EXTERNAL" ? "ACCOUNT" : "ENTRY"));
    setEntryId("");
    setEmail("");
    setExternalId("");
    setNote("");
    setEvidenceUrl("");
  };

  const decide = async () => {
    if (!choosing) return;
    if ((mode === "ENTRY" || mode === "ACCOUNT") && handPickIsOverride && !note.trim()) {
      toast.error("Picking by hand overrides this campaign's method. Say why in the note.");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = { campaignItemId: choosing.id, mode, note: note || undefined, evidenceUrl: evidenceUrl || undefined };
      if (mode === "ENTRY") body.entryId = Number(entryId);
      if (mode === "ACCOUNT") Object.assign(body, { accountEmail: email, externalParticipantId: externalId || undefined });
      await api(token, `/campaigns/${campaignId}/awards`, { method: "POST", body: JSON.stringify(body) });
      toast.success("Winner chosen. They've been asked to confirm delivery details.");
      setChoosing(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const approve = async (a: Award) => {
    setBusy(true);
    try {
      await api(token, `/campaigns/${campaignId}/awards/${a.id}/approve`, { method: "POST" });
      toast.success("Winner approved");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const end = async () => {
    if (!ending) return;
    if (!reason.trim()) {
      toast.error("Give a reason.");
      return;
    }
    setBusy(true);
    try {
      await api(token, `/campaigns/${campaignId}/awards/${ending.award.id}/${ending.expire ? "expire" : "cancel"}`, { method: "POST", body: JSON.stringify({ reason }) });
      toast.success(ending.expire ? "Marked as unclaimed. The prize can be awarded again." : "Award cancelled. The prize can be awarded again.");
      setEnding(null);
      setReason("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const liveFor = (itemId: number) => awards?.find((a) => a.campaignItemId === itemId && ["PROPOSED", "AWAITING_CLAIM", "ALLOCATED"].includes(a.status));
  const pastFor = (itemId: number) => (awards || []).filter((a) => a.campaignItemId === itemId && ["CANCELLED", "EXPIRED"].includes(a.status));

  return (
    <section className="border-t border-gray-100 pt-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
        <Trophy size={13} className="text-[#037F44]" /> Winners
      </p>
      <p className="text-[11px] text-gray-500 mb-3">
        {running ? "Choose a winner for each prize. The winner confirms their delivery details, then the prize goes through Give for delivery." : "Winners can be chosen once the campaign is running."}
      </p>
      {items === null || awards === null ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500">Add a prize first.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => {
            const a = liveFor(it.id);
            const past = pastFor(it.id);
            return (
              <li key={it.id} className="border border-gray-100 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800 flex-1 min-w-0 truncate">{it.listing?.Product?.name || `Give item #${it.giveListingId}`}</span>
                  {a ? <Pill className={AWARD_STATUS[a.status].cls}>{AWARD_STATUS[a.status].label}</Pill> : <Pill className="bg-[#f1f2f4] text-[#5f6672]">No winner yet</Pill>}
                </div>

                {a ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-700">
                      <span className="font-semibold">{a.winner?.name || "Winner"}</span>
                      {a.winner?.email ? <span className="text-gray-500"> · {a.winner.email}</span> : null}
                      {a.externalParticipantId ? <span className="text-gray-500"> · partner ID {a.externalParticipantId}</span> : null}
                    </p>
                    <p className="text-gray-500">
                      {MODE_LABEL[a.evidence?.mode || ""] || a.method}
                      {a.evidence?.poolSize ? ` from ${a.evidence.poolSize} accepted ${a.evidence.poolSize === 1 ? "entry" : "entries"}` : ""}
                      {a.evidence?.winningScore != null ? `, score ${a.evidence.winningScore}` : ""}
                      {a.decidedByType === "PARTNER" ? " · named by the partner" : ""}
                      {a.evidence?.override ? " · override" : ""} · {fmtDate(a.createdAt, true)}
                    </p>
                    {a.evidence?.note && <p className="text-gray-600">Note: {a.evidence.note}</p>}
                    {a.evidence?.url && (
                      <a href={a.evidence.url} target="_blank" rel="noopener noreferrer" className="text-[#037F44] hover:underline break-all">
                        Evidence link
                      </a>
                    )}
                    {a.status === "AWAITING_CLAIM" && (
                      <p className={a.overdue ? "text-[#b42318] font-medium" : "text-gray-500"}>
                        <Clock size={11} className="inline mr-1" />
                        {a.overdue ? `Claim deadline passed (${fmtDate(a.claimBy)})` : `Winner has until ${fmtDate(a.claimBy)} to confirm delivery details`}
                      </p>
                    )}
                    {a.progress && (
                      <p className="text-gray-700">
                        Give: {FULFILMENT[a.progress.fulfilmentStatus || ""] || a.progress.fulfilmentStatus || "—"}
                        {a.progress.receiptConfirmed ? " · receipt confirmed by winner" : ""}
                      </p>
                    )}
                    {canEdit && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {a.status === "PROPOSED" && (
                          <button disabled={busy} onClick={() => approve(a)} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60 ${BTN.primary}`}>
                            <Check size={12} /> Approve winner
                          </button>
                        )}
                        {["PROPOSED", "AWAITING_CLAIM"].includes(a.status) && (
                          <button disabled={busy} onClick={() => setEnding({ award: a, expire: false })} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60 ${BTN.danger}`}>
                            <X size={12} /> {a.status === "PROPOSED" ? "Reject" : "Cancel award"}
                          </button>
                        )}
                        {a.status === "AWAITING_CLAIM" && a.overdue && (
                          <button disabled={busy} onClick={() => setEnding({ award: a, expire: true })} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60 ${BTN.secondary}`}>
                            Mark unclaimed
                          </button>
                        )}
                        {a.status === "ALLOCATED" && <span className="text-[11px] text-gray-500">Manage delivery in Give &amp; Circular → Allocations.</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  canEdit &&
                  running && (
                    <button
                      disabled={it.listing?.state !== "AVAILABLE"}
                      onClick={() => openChooser(it)}
                      className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 ${BTN.primary}`}
                      title={it.listing?.state !== "AVAILABLE" ? "Verify the item in Give first" : undefined}
                    >
                      <Trophy size={12} /> Choose winner
                    </button>
                  )
                )}
                {!a && it.listing?.state === "SUBMITTED" && <p className="text-[11px] text-[#9a6b0f] mt-1">Verify this item in Give before awarding it.</p>}
                {past.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    Earlier: {past.map((p) => `${p.winner?.name || "winner"} (${p.status.toLowerCase()}${p.cancelReason ? `: ${p.cancelReason}` : ""})`).join("; ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={!!choosing}
        title={`Choose a winner: ${choosing?.listing?.Product?.name || "prize"}`}
        onClose={() => setChoosing(null)}
        footer={
          <>
            <button onClick={() => setChoosing(null)} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Cancel
            </button>
            <button onClick={decide} disabled={busy} className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${BTN.primary}`}>
              {busy ? "Working…" : mode === "DRAW" ? "Run the draw" : "Confirm winner"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2">
          {(
            [
              autoMode === "DRAW" && { m: "DRAW", icon: Shuffle, title: "Random draw", hint: `Draws one of the ${entries.length} accepted entries. The pool and pick are recorded as evidence.` },
              autoMode === "FIRST_COME" && { m: "FIRST_COME", icon: Clock, title: "First come", hint: "Gives the prize to the earliest accepted entry without a prize." },
              autoMode === "TOP_SCORE" && { m: "TOP_SCORE", icon: Star, title: "Top score", hint: "Gives the prize to the highest-scoring accepted entry." },
              participationMode !== "EXTERNAL" && { m: "ENTRY", icon: UserCheck, title: handPickIsOverride ? "Pick an entry by hand (override)" : "Pick an entry", hint: handPickIsOverride ? "Overrides this campaign's method. A reason is required." : "Choose from accepted entries." },
              { m: "ACCOUNT", icon: AtSign, title: "Name the winner by account", hint: "For winners confirmed elsewhere, e.g. on the partner's leaderboard. They need a SwapConnect account." },
            ].filter(Boolean) as { m: Mode; icon: typeof Shuffle; title: string; hint: string }[]
          ).map((o) => (
            <label key={o.m} className={`flex gap-3 border rounded-lg px-3 py-2.5 cursor-pointer ${mode === o.m ? "border-[#037F44] bg-[#f2fbf6]" : "border-gray-200"}`}>
              <input type="radio" name="mode" className="mt-1 accent-[#037F44]" checked={mode === o.m} onChange={() => setMode(o.m)} />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <o.icon size={14} /> {o.title}
                </span>
                <span className="block text-[11px] text-gray-500 mt-0.5">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === "ENTRY" && (
          <Field label="Accepted entry" required>
            <select className={INPUT} value={entryId} onChange={(e) => setEntryId(e.target.value)}>
              <option value="">Choose an entry</option>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.participant?.name || e.externalParticipantId || `Entry #${e.id}`}
                  {e.participant?.email ? ` (${e.participant.email})` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        {mode === "ACCOUNT" && (
          <>
            <Field label="Winner's SwapConnect account email" required>
              <input className={INPUT} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Their ID on the partner's platform" hint="Optional, e.g. the ambassador ID.">
              <input className={INPUT} value={externalId} onChange={(e) => setExternalId(e.target.value)} />
            </Field>
          </>
        )}
        <Field label={(mode === "ENTRY" || mode === "ACCOUNT") && handPickIsOverride ? "Reason" : "Note"} required={(mode === "ENTRY" || mode === "ACCOUNT") && handPickIsOverride} hint="Kept with the award as evidence.">
          <textarea className={`${INPUT} resize-none`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Field label="Evidence link" hint="Optional https:// link, e.g. the final leaderboard.">
          <input className={INPUT} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://" />
        </Field>
      </Sheet>

      <Sheet
        open={!!ending}
        title={ending?.expire ? "Mark prize as unclaimed" : ending?.award.status === "PROPOSED" ? "Reject proposed winner" : "Cancel award"}
        onClose={() => setEnding(null)}
        footer={
          <>
            <button onClick={() => setEnding(null)} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Back
            </button>
            <button onClick={end} disabled={busy} className="text-sm px-4 py-2 rounded-lg font-semibold bg-[#b42318] text-white hover:bg-[#912018] disabled:opacity-60">
              Confirm
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          {ending?.expire
            ? "The winner loses the prize and their entry is closed. The prize can then be awarded to someone else."
            : "The winner is told the prize was withdrawn, and their entry goes back into the pool. The prize can be awarded again."}
        </p>
        <Field label="Reason" required hint="The winner sees this reason.">
          <textarea className={`${INPUT} resize-none`} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Sheet>
    </section>
  );
}
