"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Download, ShieldAlert, CheckCircle2, Clock, Heart, MessageCircleHeart } from "lucide-react";

type ReceiptStatus =
  | "AWAITING_RECEIPT_CONFIRMATION"
  | "AWAITING_APPRECIATION_NOTE"
  | "APPRECIATION_SUBMITTED"
  | "DELIVERY_DISPUTED";

interface GiftReceipt {
  id: number;
  recipientConfirmed: boolean;
  receiptConfirmedAt: string | null;
  deliveryEvidenceUrl: string | null;
  appreciationNote: string | null;
  appreciationSubmittedAt: string | null;
  publicShareConsent: boolean;
  publicShareConsentAt: string | null;
  publicShareConsentRevokedAt: string | null;
  disputed: boolean;
  disputeReason: string | null;
  disputedAt: string | null;
  disputeResolutionNote: string | null;
  disputeResolvedAt: string | null;
}

interface GiftRow {
  id: number; // allocation id -- the gift reference
  giveListingId: number;
  status: string; // Allocation.status
  receiptStatus: ReceiptStatus;
  createdAt: string;
  GiveListing: {
    identityMode: "ANONYMOUS" | "PRIVATE" | "PUBLIC";
    Product: { id: number; name: string; imageUrl: string | null } | null;
    Donor: { id: number; firstName: string; lastName: string; email: string } | null;
  } | null;
  NeedProfile: {
    User: { id: number; firstName: string; lastName: string; email: string; phone: string | null } | null;
  } | null;
  GiftReceipt: GiftReceipt | null;
}

const STATUS_LABELS: Record<ReceiptStatus, string> = {
  AWAITING_RECEIPT_CONFIRMATION: "Awaiting Receipt Confirmation",
  AWAITING_APPRECIATION_NOTE: "Receipt Confirmed · Awaiting Appreciation Note",
  APPRECIATION_SUBMITTED: "Appreciation Submitted",
  DELIVERY_DISPUTED: "Delivery Disputed",
};

const STATUS_STYLES: Record<ReceiptStatus, string> = {
  AWAITING_RECEIPT_CONFIRMATION: "bg-gray-100 text-gray-600",
  AWAITING_APPRECIATION_NOTE: "bg-blue-50 text-blue-700",
  APPRECIATION_SUBMITTED: "bg-[#e6f9f0] text-[#037F44]",
  DELIVERY_DISPUTED: "bg-red-50 text-red-700",
};

const STATUS_ICON: Record<ReceiptStatus, React.ReactNode> = {
  AWAITING_RECEIPT_CONFIRMATION: <Clock size={12} />,
  AWAITING_APPRECIATION_NOTE: <CheckCircle2 size={12} />,
  APPRECIATION_SUBMITTED: <MessageCircleHeart size={12} />,
  DELIVERY_DISPUTED: <ShieldAlert size={12} />,
};

function donorName(row: GiftRow): string {
  if (row.GiveListing?.identityMode === "ANONYMOUS") return "Anonymous donor";
  const d = row.GiveListing?.Donor;
  return d ? `${d.firstName} ${d.lastName}` : "—";
}

function recipientName(row: GiftRow): string {
  const u = row.NeedProfile?.User;
  return u ? `${u.firstName} ${u.lastName}` : "—";
}

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

const VALID_STATUS_FILTERS = [
  "AWAITING_RECEIPT_CONFIRMATION",
  "AWAITING_APPRECIATION_NOTE",
  "APPRECIATION_SUBMITTED",
  "DELIVERY_DISPUTED",
  "MISSING_APPRECIATION",
];

export default function GiftManagementTab() {
  const token = useAuthToken();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<GiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [consentOnly, setConsentOnly] = useState(false);
  const [search, setSearch] = useState("");

  // Lets the Impact tab's tiles deep-link straight into the matching
  // filtered view, same convention as DonationsTab's own ?state= handling.
  useEffect(() => {
    const fromUrl = searchParams.get("status");
    if (fromUrl && VALID_STATUS_FILTERS.includes(fromUrl)) setStatusFilter(fromUrl);
  }, [searchParams]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (consentOnly) params.set("consent", "true");
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [statusFilter, consentOnly, search]);

  const fetchRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/gift-receipts?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRows(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, buildParams]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/gift-receipts/export?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed. Reports are restricted to admin/superadmin roles.");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || `SwapConnect_Gift_Appreciation_${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const resolveDispute = async () => {
    if (!selectedId || !token) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/gift-receipts/${selectedId}/resolve-dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resolutionNote: resolutionNote || undefined }),
      });
      const data = await res.json().catch(() => null);
      setResolveOpen(false);
      if (!res.ok) {
        setActionError(data?.message || "Failed to resolve dispute.");
        return;
      }
      setResolutionNote("");
      await fetchRows();
    } finally {
      setSaving(false);
    }
  };

  const missingAppreciationCount = rows.filter(
    (r) => r.GiftReceipt?.recipientConfirmed && !r.GiftReceipt?.appreciationNote && !r.GiftReceipt?.disputed
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Gift Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Recipient receipt confirmations and appreciation notes for every allocated gift.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || rows.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
        >
          <option value="">All statuses</option>
          <option value="AWAITING_RECEIPT_CONFIRMATION">Awaiting Receipt Confirmation</option>
          <option value="AWAITING_APPRECIATION_NOTE">Receipt Confirmed / Awaiting Appreciation</option>
          <option value="APPRECIATION_SUBMITTED">Appreciation Submitted</option>
          <option value="DELIVERY_DISPUTED">Delivery Disputed</option>
          <option value="MISSING_APPRECIATION">Confirmed, no note yet ({missingAppreciationCount})</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by giver, recipient, note, or gift/listing ID"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-72 max-w-full"
        />
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          <input type="checkbox" checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} />
          Public-sharing consent only
        </label>
      </div>

      {actionError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{actionError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5">Gift</th>
                  <th className="text-left px-4 py-2.5">Giver</th>
                  <th className="text-left px-4 py-2.5">Recipient</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Confirmed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      No gift records match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer hover:bg-gray-50 ${selectedId === r.id ? "bg-[#e6f9f0]" : ""}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-800">GIFT-{r.id}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[160px]">{r.GiveListing?.Product?.name}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{donorName(r)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{recipientName(r)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.receiptStatus]}`}
                        >
                          {STATUS_ICON[r.receiptStatus]}
                          {STATUS_LABELS[r.receiptStatus]}
                        </span>
                        {r.GiftReceipt?.publicShareConsent && (
                          <Heart size={12} className="inline ml-1.5 text-pink-500" fill="currentColor" />
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{fmt(r.GiftReceipt?.receiptConfirmedAt ?? null)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          {!selected ? (
            <div className="text-center py-20 text-gray-400 text-sm">Select a gift record to view details.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-800">GIFT-{selected.id}</h2>
                <p className="text-xs text-gray-400">{selected.GiveListing?.Product?.name}</p>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[selected.receiptStatus]}`}
              >
                {STATUS_ICON[selected.receiptStatus]}
                {STATUS_LABELS[selected.receiptStatus]}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Giver</p>
                  <p className="font-medium text-gray-700">{donorName(selected)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Recipient</p>
                  <p className="font-medium text-gray-700">{recipientName(selected)}</p>
                  {selected.NeedProfile?.User?.phone && (
                    <p className="text-gray-400">{selected.NeedProfile.User.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400">Receipt confirmed</p>
                  <p className="font-medium text-gray-700">{fmt(selected.GiftReceipt?.receiptConfirmedAt ?? null)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Appreciation submitted</p>
                  <p className="font-medium text-gray-700">{fmt(selected.GiftReceipt?.appreciationSubmittedAt ?? null)}</p>
                </div>
              </div>

              {selected.GiftReceipt?.deliveryEvidenceUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Delivery evidence (recipient-uploaded)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.GiftReceipt.deliveryEvidenceUrl}
                    alt="Delivery evidence"
                    className="rounded-lg border border-gray-100 max-h-48 object-cover"
                  />
                </div>
              )}

              {selected.GiftReceipt?.appreciationNote ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Appreciation note</p>
                  <blockquote className="text-sm text-gray-700 bg-[#f7f8fb] border-l-2 border-[#037F44] rounded-r-lg px-3 py-2 italic">
                    &ldquo;{selected.GiftReceipt.appreciationNote}&rdquo;
                  </blockquote>
                </div>
              ) : selected.GiftReceipt?.recipientConfirmed ? (
                <p className="text-xs text-gray-400 italic">No appreciation note submitted yet (optional for the recipient).</p>
              ) : null}

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Public-sharing consent:</span>
                {selected.GiftReceipt?.publicShareConsent ? (
                  <span className="text-pink-600 font-medium flex items-center gap-1">
                    <Heart size={12} fill="currentColor" /> Consented {fmt(selected.GiftReceipt.publicShareConsentAt)}
                  </span>
                ) : selected.GiftReceipt?.publicShareConsentRevokedAt ? (
                  <span className="text-gray-500 font-medium">Revoked {fmt(selected.GiftReceipt.publicShareConsentRevokedAt)}</span>
                ) : (
                  <span className="text-gray-400 font-medium">Not given</span>
                )}
              </div>

              {selected.GiftReceipt?.disputed && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                    <ShieldAlert size={13} /> Delivery disputed
                  </p>
                  <p className="text-xs text-red-700">{selected.GiftReceipt.disputeReason}</p>
                  <p className="text-[11px] text-red-400">Reported {fmt(selected.GiftReceipt.disputedAt)}</p>
                  <button
                    onClick={() => setResolveOpen(true)}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium"
                  >
                    Resolve Dispute
                  </button>
                </div>
              )}

              {!selected.GiftReceipt?.disputed && selected.GiftReceipt?.disputeResolvedAt && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-600">Previously disputed — resolved {fmt(selected.GiftReceipt.disputeResolvedAt)}</p>
                  {selected.GiftReceipt.disputeResolutionNote && (
                    <p className="text-xs text-gray-500 mt-1">{selected.GiftReceipt.disputeResolutionNote}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={resolveOpen}
        title="Resolve this delivery dispute?"
        message={
          <div className="space-y-2">
            <p>This clears the dispute flag. Add a resolution note for the record (optional).</p>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Re-delivered on 12 Nov, recipient confirmed by phone"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
        }
        variant="warning"
        confirmLabel="Resolve"
        loading={saving}
        onConfirm={resolveDispute}
        onClose={() => setResolveOpen(false)}
      />
    </div>
  );
}
