"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type GiveState = "SUBMITTED" | "AVAILABLE" | "MATCHED" | "ALLOCATED" | "IN_FULFILMENT" | "COMPLETED" | "REJECTED" | "CANCELLED";
const GIVE_STATES: GiveState[] = ["SUBMITTED", "AVAILABLE", "MATCHED", "ALLOCATED", "IN_FULFILMENT", "COMPLETED", "REJECTED", "CANCELLED"];

interface GiveListing {
  id: number;
  state: GiveState;
  identityMode: "ANONYMOUS" | "PRIVATE" | "PUBLIC";
  donorDisplayName: string | null;
  pickupNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  eligibleLifeCategories: string[] | null;
  eligibleAgeMin: number | null;
  eligibleAgeMax: number | null;
  eligibleLocation: string | null;
  Product: {
    id: number;
    name: string;
    imageUrl: string;
    otherImages?: string[] | null;
    brand: string | null;
    condition: string;
    categoryId: number | null;
    metaData?: Record<string, unknown> | null;
  } | null;
  Donor: { id: number; firstName: string; lastName: string; email: string; phone: string | null } | null;
}

// metaData keys are whatever the donor form submitted (ram, storage/rom,
// batteryHealth, batteryCycleCount, batteryCondition, plus any dynamic
// category attributes) -- camelCase -> "Title Case" so the panel doesn't
// need a hand-maintained label map that drifts from the form.
function formatSpecLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatSpecValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const LIFE_CATEGORY_LABELS: Record<string, string> = {
  STUDENT: "Student",
  WORKING_PROFESSIONAL: "Working Professional",
  BUSINESS_OWNER: "Business Owner",
  ENTREPRENEUR: "Entrepreneur",
  FREELANCER: "Freelancer",
  JOB_SEEKER: "Job Seeker",
  SKILLED_WORKER: "Skilled Worker",
  LEARNING_A_SKILL: "Learning a Skill",
  APPRENTICE: "Apprentice",
  TEACHER_EDUCATOR: "Teacher / Educator",
  RESEARCHER: "Researcher",
  CONTENT_CREATOR: "Content Creator",
  OTHER: "Other",
};

function describeEligibility(listing: GiveListing): string {
  const parts: string[] = [];
  if (listing.eligibleLifeCategories?.length) {
    parts.push(listing.eligibleLifeCategories.map((c) => LIFE_CATEGORY_LABELS[c] ?? c).join(", "));
  }
  if (listing.eligibleAgeMin != null || listing.eligibleAgeMax != null) {
    parts.push(`Age ${listing.eligibleAgeMin ?? "0"}–${listing.eligibleAgeMax ?? "+"}`);
  }
  if (listing.eligibleLocation) {
    parts.push(listing.eligibleLocation);
  }
  return parts.length > 0 ? parts.join(" · ") : "Open to all eligible recipients";
}

const STATE_COLORS: Record<GiveState, string> = {
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  AVAILABLE: "bg-blue-100 text-blue-800",
  MATCHED: "bg-purple-100 text-purple-800",
  ALLOCATED: "bg-indigo-100 text-indigo-800",
  IN_FULFILMENT: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default function DonationsTab() {
  const token = useAuthToken();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<GiveListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<GiveState | "">("");

  // Lets the Give Impact tab's tiles deep-link straight into the matching
  // filtered view (e.g. ?tab=donations&state=AVAILABLE) instead of landing
  // here with every donation mixed together regardless of which tile was
  // clicked.
  useEffect(() => {
    const fromUrl = searchParams.get("state");
    if (fromUrl && GIVE_STATES.includes(fromUrl as GiveState)) setStateFilter(fromUrl as GiveState);
  }, [searchParams]);
  const [selected, setSelected] = useState<GiveListing | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"verify" | "reject" | "cancel" | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // The list endpoint's Product include is attribute-whitelisted (id, name,
  // imageUrl, brand, condition, categoryId only -- see GiveService.
  // adminListGiveListings) so photos beyond the cover image and every spec
  // the donor entered (metaData: RAM/storage/battery health/etc.) never
  // reach this row at all. The detail endpoint has no such restriction, so
  // opening a donation fetches the full record instead of settling for
  // whatever the list happened to include.
  const openReview = async (item: GiveListing) => {
    setSelected(item);
    setReason("");
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/listings/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.data) setSelected(data.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchListings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (stateFilter) params.set("state", stateFilter);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setListings(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, stateFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const runAction = async (action: "verify" | "reject" | "cancel") => {
    if (!selected || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/give/listings/${selected.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      setConfirmAction(null);
      setSelected(null);
      setReason("");
      await fetchListings();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Donations</h1>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as GiveState | "")}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All States</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="AVAILABLE">Available</option>
          <option value="MATCHED">Matched</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="IN_FULFILMENT">In Fulfilment</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No donations found.</div>
      ) : (
        <>
        {/* Mobile/tablet cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 cursor-pointer transition-shadow hover:shadow-md active:bg-gray-50"
              onClick={() => openReview(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium break-words">
                    {item.Product?.name ?? "—"}
                    {item.Product?.brand && <span className="text-gray-400 ml-1">{item.Product.brand}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.identityMode === "ANONYMOUS" ? "Anonymous" : `${item.Donor?.firstName ?? ""} ${item.Donor?.lastName ?? ""}`}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <span className={`w-fit text-xs px-2 py-1 rounded-full font-medium ${STATE_COLORS[item.state]}`}>{item.state}</span>
              <button
                onClick={(e) => { e.stopPropagation(); openReview(item); }}
                className="mt-1 min-h-[44px] flex items-center justify-center gap-1.5 text-sm text-brand-emerald bg-brand-emerald-light hover:bg-brand-emerald hover:text-white rounded-lg font-semibold transition-colors"
              >
                <Eye size={15} /> Review
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Item</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Donor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Identity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">State</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3" />
                <th className="pr-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openReview(item)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{item.Product?.name ?? "—"}</span>
                    {item.Product?.brand && <span className="text-gray-400 ml-1">{item.Product.brand}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {item.identityMode === "ANONYMOUS" ? "Anonymous" : `${item.Donor?.firstName ?? ""} ${item.Donor?.lastName ?? ""}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.identityMode}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATE_COLORS[item.state]}`}>{item.state}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); openReview(item); }}
                      className="flex items-center gap-1 text-xs text-brand-emerald bg-brand-emerald-light hover:bg-brand-emerald hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <Eye size={13} /> Review
                    </button>
                  </td>
                  <td className="pr-3">
                    <ChevronRight size={16} className="text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Review Donation</h2>
              <button onClick={() => { setSelected(null); setLightboxImage(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Item</p>
              <p className="font-semibold text-sm">{selected.Product?.name}</p>
              <p className="text-xs text-gray-400">{selected.Product?.brand} · {selected.Product?.condition}</p>
            </div>

            {(() => {
              const photos = [selected.Product?.imageUrl, ...(selected.Product?.otherImages ?? [])].filter(
                (src): src is string => !!src
              );
              if (photos.length === 0) {
                return detailLoading ? (
                  <div className="mb-4 h-24 bg-gray-50 rounded-lg animate-pulse" />
                ) : null;
              }
              return (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Photos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt={`${selected.Product?.name ?? "Item"} photo ${i + 1}`}
                        onClick={() => setLightboxImage(src)}
                        className="w-full aspect-square object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const entries = Object.entries(selected.Product?.metaData ?? {})
                .map(([key, value]) => [key, formatSpecValue(value)] as const)
                .filter((entry): entry is [string, string] => entry[1] !== null);
              if (entries.length === 0) return null;
              return (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Properties</p>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-gray-50 rounded-lg p-3">
                    {entries.map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[11px] text-gray-400">{formatSpecLabel(key)}</dt>
                        <dd className="text-sm text-gray-800 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Donor</p>
              <p className="text-sm">
                {selected.identityMode === "ANONYMOUS" ? "Anonymous donor" : `${selected.Donor?.firstName} ${selected.Donor?.lastName}`}
              </p>
              {selected.identityMode !== "ANONYMOUS" && (
                <p className="text-xs text-gray-400">{selected.Donor?.email} · {selected.Donor?.phone}</p>
              )}
            </div>

            {selected.pickupNotes && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Pickup Notes</p>
                <p className="text-sm bg-gray-50 rounded-lg p-3">{selected.pickupNotes}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Eligibility (donor-set)</p>
              <p className="text-sm">{describeEligibility(selected)}</p>
            </div>

            <div className="mb-4">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATE_COLORS[selected.state]}`}>{selected.state}</span>
            </div>

            {selected.state === "SUBMITTED" && (
              <>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Reason (for rejection, optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Why isn't this a good fit?"
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="flex-1 border border-red-200 text-red-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setConfirmAction("verify")}
                    className="flex-1 bg-brand-emerald text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-emerald-hover"
                  >
                    Verify
                  </button>
                </div>
              </>
            )}

            {!["COMPLETED", "REJECTED", "CANCELLED"].includes(selected.state) && selected.state !== "SUBMITTED" && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-3"
                />
                <button
                  onClick={() => setConfirmAction("cancel")}
                  className="w-full border border-red-200 text-red-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-50"
                >
                  Cancel Donation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-6"
          onClick={() => setLightboxImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImage} alt="Donated item" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === "verify"
            ? "Verify this donation?"
            : confirmAction === "reject"
              ? "Reject this donation?"
              : "Cancel this donation?"
        }
        message={
          confirmAction === "verify"
            ? "The item becomes available for matching with a recipient."
            : "This notifies the donor and cannot be undone."
        }
        variant={confirmAction === "verify" ? "default" : "warning"}
        confirmLabel={confirmAction === "verify" ? "Verify" : confirmAction === "reject" ? "Reject" : "Cancel Donation"}
        loading={saving}
        onConfirm={() => confirmAction && runAction(confirmAction)}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}
