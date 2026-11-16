"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, PackageOpen } from "lucide-react";
import { API_URL } from "@/lib/config";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ProgrammeDonation {
  id: number;
  programmeName: string;
  itemDescription: string;
  quantity: number;
  donatedAt: string;
  partnerName: string | null;
  location: string | null;
  notes: string | null;
  RecordedBy?: { firstName: string | null; lastName: string | null } | null;
}

interface Totals {
  records: number;
  devices: number;
  programmes: number;
}

type FormState = {
  programmeName: string;
  itemDescription: string;
  quantity: string;
  donatedAt: string;
  partnerName: string;
  location: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY: FormState = { programmeName: "", itemDescription: "", quantity: "", donatedAt: today(), partnerName: "", location: "", notes: "" };
const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#037F44]/30 focus:border-[#037F44]";

// Donations handed out through offline programmes/drives. Each record's
// quantity counts toward the public homepage's "Donations Completed".
export default function ProgrammeDonationsSection({ token }: { token: string }) {
  const [records, setRecords] = useState<ProgrammeDonation[]>([]);
  const [totals, setTotals] = useState<Totals>({ records: 0, devices: 0, programmes: 0 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProgrammeDonation | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ProgrammeDonation | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/give/programme-donations`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Couldn't load programme donations");
      setRecords(body.data.records);
      setTotals(body.data.totals);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load programme donations");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, donatedAt: today() });
    setFormOpen(true);
  };
  const openEdit = (r: ProgrammeDonation) => {
    setEditing(r);
    setForm({
      programmeName: r.programmeName,
      itemDescription: r.itemDescription,
      quantity: String(r.quantity),
      donatedAt: r.donatedAt.slice(0, 10),
      partnerName: r.partnerName ?? "",
      location: r.location ?? "",
      notes: r.notes ?? "",
    });
    setFormOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/give/programme-donations${editing ? `/${editing.id}` : ""}`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Couldn't save this donation");
      toast.success(editing ? "Programme donation updated" : "Programme donation recorded");
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save this donation");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/programme-donations/${deleting.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Couldn't remove this donation");
      toast.success("Programme donation removed");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove this donation");
    } finally {
      setDeleteBusy(false);
    }
  };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Programme Donations</h2>
          <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
            Devices given out through offline programmes and drives. Each device counts toward
            &ldquo;Donations Completed&rdquo; on the homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#037F44] hover:bg-[#026835] text-white text-sm font-semibold px-4 py-2.5 min-h-[44px] transition-colors"
        >
          <Plus size={16} /> Record donation
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Devices donated", value: totals.devices },
          { label: "Programmes", value: totals.programmes },
          { label: "Records", value: totals.records },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xl font-bold text-gray-800 tabular-nums">{t.value}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-sm text-gray-500">Loading…</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <PackageOpen className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-sm font-medium text-gray-700">No programme donations recorded yet</p>
          <p className="text-xs text-gray-500 mt-1">Record devices handed over at a drive or partner programme.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Programme</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold">Partner / location</th>
                  <th className="px-4 py-3 font-semibold">Recorded by</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDate(r.donatedAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.programmeName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.itemDescription}
                      {r.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{r.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{[r.partnerName, r.location].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{[r.RecordedBy?.firstName, r.RecordedBy?.lastName].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.programmeName}`} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setDeleting(r)} aria-label={`Remove ${r.programmeName}`} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {records.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 break-words">{r.programmeName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDate(r.donatedAt)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e6f9f0] text-[#037F44] text-xs font-bold px-2.5 py-1 tabular-nums">
                    {r.quantity} {r.quantity === 1 ? "device" : "devices"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 break-words">{r.itemDescription}</p>
                {(r.partnerName || r.location) && (
                  <p className="text-xs text-gray-500 mt-1">{[r.partnerName, r.location].filter(Boolean).join(" · ")}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => openEdit(r)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 py-2 min-h-[44px]">
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => setDeleting(r)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-100 text-sm font-medium text-red-700 py-2 min-h-[44px]">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => !saving && setFormOpen(false)}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-800">{editing ? "Edit programme donation" : "Record programme donation"}</h3>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Close" className="p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Programme name *
                <input required maxLength={160} value={form.programmeName} onChange={set("programmeName")} placeholder="e.g. Back to School Device Drive" className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Items donated *
                <input required maxLength={255} value={form.itemDescription} onChange={set("itemDescription")} placeholder="e.g. Refurbished laptops and tablets" className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                  Number of devices *
                  <input required type="number" inputMode="numeric" min={1} max={100000} step={1} value={form.quantity} onChange={set("quantity")} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                  Date given *
                  <input required type="date" max={today()} value={form.donatedAt} onChange={set("donatedAt")} className={inputCls} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Partner / sponsor
                <input maxLength={160} value={form.partnerName} onChange={set("partnerName")} placeholder="Optional" className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Location
                <input maxLength={160} value={form.location} onChange={set("location")} placeholder="Optional, e.g. Ikeja, Lagos" className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Notes
                <textarea maxLength={2000} rows={3} value={form.notes} onChange={set("notes")} placeholder="Optional" className={inputCls} />
              </label>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 py-2.5 min-h-[44px]">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#037F44] hover:bg-[#026835] disabled:opacity-60 text-white text-sm font-semibold py-2.5 min-h-[44px]">
                {saving ? "Saving…" : editing ? "Save changes" : "Record donation"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        variant="danger"
        title="Remove this programme donation?"
        message={
          deleting ? (
            <>
              &ldquo;{deleting.programmeName}&rdquo; ({deleting.quantity} {deleting.quantity === 1 ? "device" : "devices"}) will be removed and the
              homepage&apos;s Donations Completed will drop by {deleting.quantity}.
            </>
          ) : null
        }
        confirmLabel="Remove"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => !deleteBusy && setDeleting(null)}
      />
    </section>
  );
}
