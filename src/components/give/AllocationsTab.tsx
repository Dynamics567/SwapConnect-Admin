"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface GiveListingSummary {
  id: number;
  state: string;
  eligibleLifeCategories: string[] | null;
  eligibleAgeMin: number | null;
  eligibleAgeMax: number | null;
  eligibleLocation: string | null;
  Product: { id: number; name: string; imageUrl: string; categoryId: number | null } | null;
  Donor: { id: number; firstName: string; lastName: string } | null;
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

function describeEligibility(listing: GiveListingSummary): string {
  const parts: string[] = [];
  if (listing.eligibleLifeCategories?.length) {
    parts.push(listing.eligibleLifeCategories.map((c) => LIFE_CATEGORY_LABELS[c] ?? c).join(", "));
  }
  if (listing.eligibleAgeMin != null || listing.eligibleAgeMax != null) {
    parts.push(`Age ${listing.eligibleAgeMin ?? "0"}–${listing.eligibleAgeMax ?? "+"}`);
  }
  if (listing.eligibleLocation) parts.push(listing.eligibleLocation);
  return parts.length > 0 ? parts.join(" · ") : "Open to all eligible recipients";
}

interface Candidate {
  id: number;
  reason: string;
  location: string;
  ageBand: string;
  lifeCategories: string[];
  deliveryAddress: string | null;
  createdAt: string;
  User: { id: number; firstName: string; lastName: string; phone: string | null } | null;
}

interface MatchRow {
  id: number;
  status: string;
  matchNotes: string | null;
  NeedProfile: { id: number; reason: string; deliveryAddress: string | null; User: { id: number; firstName: string; lastName: string } | null } | null;
}

interface FulfilmentRow {
  id: number;
  status: string;
  method: string | null;
  note: string | null;
}

interface AllocationRow {
  id: number;
  status: string;
  Fulfilment: FulfilmentRow | null;
}

interface GiveListingDetail extends GiveListingSummary {
  Matches: MatchRow[];
  Allocations: AllocationRow[];
}

export default function AllocationsTab() {
  const token = useAuthToken();
  const [listings, setListings] = useState<GiveListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<GiveListingDetail | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [fulfilmentNote, setFulfilmentNote] = useState("");
  const [confirmAllocateMatchId, setConfirmAllocateMatchId] = useState<number | null>(null);

  const fetchListings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/listings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const all: GiveListingSummary[] = data.data ?? [];
      setListings(all.filter((l) => !["SUBMITTED", "COMPLETED", "REJECTED", "CANCELLED"].includes(l.state)));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const loadDetail = useCallback(
    async (id: number) => {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/give/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDetail(data.data ?? null);

      if (data.data?.state === "AVAILABLE") {
        const cRes = await fetch(`${API_URL}/api/admin/give/listings/${id}/candidates`, { headers: { Authorization: `Bearer ${token}` } });
        const cData = await cRes.json();
        setCandidates(cData.data ?? []);
      } else {
        setCandidates([]);
      }
    },
    [token]
  );

  const selectListing = async (id: number) => {
    setSelectedId(id);
    setNotes("");
    await loadDetail(id);
  };

  const proposeMatch = async (needProfileId: number) => {
    if (!selectedId || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/give/listings/${selectedId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ needProfileId, notes: notes || undefined }),
      });
      await fetchListings();
      await loadDetail(selectedId);
    } finally {
      setSaving(false);
    }
  };

  const allocate = async (matchId: number) => {
    if (!selectedId || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/give/listings/${selectedId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matchId }),
      });
      setConfirmAllocateMatchId(null);
      await fetchListings();
      await loadDetail(selectedId);
    } finally {
      setSaving(false);
    }
  };

  const updateFulfilment = async (fulfilmentId: number, status: "IN_TRANSIT" | "DELIVERED" | "FAILED") => {
    if (!selectedId || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/give/fulfilment/${fulfilmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, note: fulfilmentNote || undefined }),
      });
      setFulfilmentNote("");
      await fetchListings();
      await loadDetail(selectedId);
    } finally {
      setSaving(false);
    }
  };

  const activeAllocation = detail?.Allocations?.find((a) => ["ALLOCATED", "IN_FULFILMENT"].includes(a.status));
  const livematches = detail?.Matches?.filter((m) => ["PROPOSED", "ACCEPTED"].includes(m.status)) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm text-gray-600">Items awaiting match/allocation</div>
        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">Nothing in the pipeline right now.</div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {listings.map((l) => (
              <button
                key={l.id}
                onClick={() => selectListing(l.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${selectedId === l.id ? "bg-[#e6f9f0]" : ""}`}
              >
                <div className="font-medium">{l.Product?.name}</div>
                <div className="text-xs text-gray-400">{l.state}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {!detail ? (
          <div className="text-center py-20 text-gray-400">Select an item to manage matching/allocation.</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">{detail.Product?.name}</h2>
              <p className="text-xs text-gray-400">State: {detail.state}</p>
              <p className="text-xs text-gray-500 mt-1">Eligibility: {describeEligibility(detail)}</p>
            </div>

            {detail.state === "AVAILABLE" && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Candidate recipients</h3>
                {candidates.length === 0 ? (
                  <p className="text-sm text-gray-400">No open, verified need profiles match this listing&apos;s eligibility criteria yet.</p>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Match notes (optional)"
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    />
                    {candidates.map((c) => (
                      <div key={c.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{c.User?.firstName} {c.User?.lastName}</p>
                          <p className="text-xs text-gray-400">{c.ageBand} · {c.location} · {c.lifeCategories.map((lc) => LIFE_CATEGORY_LABELS[lc] ?? lc).join(", ")}</p>
                          <p className="text-xs text-gray-400 max-w-sm truncate">{c.reason}</p>
                          {!c.deliveryAddress && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 uppercase">
                              No delivery address yet
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => proposeMatch(c.id)}
                          disabled={saving}
                          className="text-xs bg-[#037F44] text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
                        >
                          Propose Match
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detail.state === "MATCHED" && livematches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Proposed match</h3>
                {livematches.map((m) => {
                  const hasAddress = !!m.NeedProfile?.deliveryAddress;
                  return (
                    <div key={m.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{m.NeedProfile?.User?.firstName} {m.NeedProfile?.User?.lastName}</p>
                        <p className="text-xs text-gray-400">{m.status}</p>
                        {!hasAddress && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 uppercase">
                            Recipient hasn&apos;t provided a delivery address — allocation will be blocked
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmAllocateMatchId(m.id)}
                        disabled={!hasAddress}
                        title={!hasAddress ? "Recipient must supply a delivery address before this can be allocated" : undefined}
                        className="text-xs bg-[#037F44] text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Allocate
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeAllocation && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Fulfilment</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Status: <span className="font-medium">{activeAllocation.Fulfilment?.status}</span>
                </p>
                <textarea
                  value={fulfilmentNote}
                  onChange={(e) => setFulfilmentNote(e.target.value)}
                  placeholder="Note (optional)"
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-2"
                />
                <div className="flex gap-2">
                  {activeAllocation.Fulfilment?.status === "PENDING_HANDOVER" && (
                    <button
                      onClick={() => activeAllocation.Fulfilment && updateFulfilment(activeAllocation.Fulfilment.id, "IN_TRANSIT")}
                      disabled={saving}
                      className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                    >
                      Mark In Transit
                    </button>
                  )}
                  <button
                    onClick={() => activeAllocation.Fulfilment && updateFulfilment(activeAllocation.Fulfilment.id, "DELIVERED")}
                    disabled={saving}
                    className="flex-1 bg-[#037F44] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                  >
                    Mark Delivered
                  </button>
                  <button
                    onClick={() => activeAllocation.Fulfilment && updateFulfilment(activeAllocation.Fulfilment.id, "FAILED")}
                    disabled={saving}
                    className="flex-1 border border-red-200 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                  >
                    Mark Failed
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmAllocateMatchId !== null}
        title="Allocate this item?"
        message="This locks the item to the matched recipient and notifies both the donor and recipient. This cannot be undone without a failed-delivery reversal."
        variant="warning"
        confirmLabel="Allocate"
        loading={saving}
        onConfirm={() => confirmAllocateMatchId && allocate(confirmAllocateMatchId)}
        onClose={() => setConfirmAllocateMatchId(null)}
      />
    </div>
  );
}
