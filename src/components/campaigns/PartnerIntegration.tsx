"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Webhook, Copy, RotateCw, Send, Trash2, Plus, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Sheet, Field, INPUT, Pill } from "./Sheet";
import { api, BTN, fmtDate, type Meta } from "./campaignLabels";

// API keys, webhook endpoints and webhook delivery history for one partner.
// Secrets are shown exactly once, right after they're created.

interface Key {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  active: boolean;
}
interface Hook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  secretHint: string;
  createdAt: string;
  stats?: { deliveredLast7Days: number; retrying: number; gaveUp: number };
}
interface Delivery {
  id: number;
  webhookId: number;
  eventId: string;
  eventType: string;
  status: "PENDING" | "DELIVERED" | "FAILED" | "DEAD";
  attempts: number;
  nextAttemptAt: string | null;
  lastStatusCode: number | null;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
  payload: unknown;
}

const SCOPE_LABEL: Record<string, string> = {
  "campaigns:read": "Read campaigns, prizes and winners",
  "participants:read": "Read and verify participants",
  "winners:write": "Name winners",
};
const DELIVERY_STYLE: Record<Delivery["status"], { label: string; cls: string }> = {
  PENDING: { label: "Queued", cls: "bg-[#eaf2fd] text-[#1e5bb8]" },
  DELIVERED: { label: "Delivered", cls: "bg-[#e6f9f0] text-[#037F44]" },
  FAILED: { label: "Retrying", cls: "bg-[#fef6e4] text-[#9a6b0f]" },
  DEAD: { label: "Gave up", cls: "bg-[#fdecec] text-[#b42318]" },
};

function OneTimeSecret({ label, value, onDone }: { label: string; value: string; onDone: () => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy. Select it and copy manually.");
    }
  };
  return (
    <div className="rounded-lg border border-[#f3d48a] bg-[#fffaf0] p-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[#7a560c]">
        <ShieldAlert size={13} /> Copy this {label} now. It won&apos;t be shown again.
      </p>
      <div className="flex gap-2">
        <code className="flex-1 min-w-0 break-all text-[11px] bg-white border border-gray-200 rounded px-2 py-1.5 font-mono">{value}</code>
        <button onClick={copy} className="p-2 rounded-lg border border-gray-200 hover:bg-white" aria-label="Copy">
          <Copy size={14} />
        </button>
      </div>
      <button onClick={onDone} className="text-xs font-semibold text-[#037F44] hover:underline">
        I&apos;ve stored it safely
      </button>
    </div>
  );
}

export default function PartnerIntegration({ token, partnerId, approvedDomains, apiEnabled, meta, canEdit }: { token: string | null; partnerId: number; approvedDomains: string[]; apiEnabled: boolean; meta: Meta | null; canEdit: boolean }) {
  const base = `/partners/${partnerId}`;
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [hooks, setHooks] = useState<Hook[] | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [openPayload, setOpenPayload] = useState<number | null>(null);
  const [newSecret, setNewSecret] = useState<{ label: string; value: string } | null>(null);
  const [keyForm, setKeyForm] = useState<{ open: boolean; name: string; scopes: string[]; expiresInDays: string }>({ open: false, name: "", scopes: [], expiresInDays: "" });
  const [hookForm, setHookForm] = useState<{ open: boolean; id: number | null; url: string; events: string[] }>({ open: false, id: null, url: "", events: [] });
  const [confirm, setConfirm] = useState<{ kind: "revoke" | "delete" | "rotate"; id: number; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const scopes = (meta as Meta & { apiScopes?: string[] })?.apiScopes || Object.keys(SCOPE_LABEL);
  const eventTypes = (meta as Meta & { eventTypes?: string[] })?.eventTypes || [];

  const load = useCallback(async () => {
    try {
      const [k, h] = await Promise.all([api<Key[]>(token, `${base}/api-keys`), api<Hook[]>(token, `${base}/webhooks`)]);
      setKeys(k);
      setHooks(h);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token, base]);
  const loadDeliveries = useCallback(async () => {
    try {
      setDeliveries(await api<Delivery[]>(token, `${base}/webhook-deliveries${deliveryFilter ? `?status=${deliveryFilter}` : ""}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [token, base, deliveryFilter]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);
  useEffect(() => {
    if (token && showDeliveries) loadDeliveries();
  }, [token, showDeliveries, loadDeliveries]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const createKey = () =>
    run(async () => {
      const out = await api<Key & { key: string }>(token, `${base}/api-keys`, {
        method: "POST",
        body: JSON.stringify({ name: keyForm.name, scopes: keyForm.scopes.length ? keyForm.scopes : undefined, expiresInDays: keyForm.expiresInDays ? Number(keyForm.expiresInDays) : undefined }),
      });
      setKeyForm({ open: false, name: "", scopes: [], expiresInDays: "" });
      setNewSecret({ label: "API key", value: out.key });
      load();
    });

  const saveHook = () =>
    run(async () => {
      if (hookForm.id) {
        await api(token, `${base}/webhooks/${hookForm.id}`, { method: "PATCH", body: JSON.stringify({ url: hookForm.url, events: hookForm.events }) });
        toast.success("Webhook saved");
      } else {
        const out = await api<Hook & { secret: string }>(token, `${base}/webhooks`, { method: "POST", body: JSON.stringify({ url: hookForm.url, events: hookForm.events }) });
        setNewSecret({ label: "signing secret", value: out.secret });
      }
      setHookForm({ open: false, id: null, url: "", events: [] });
      load();
    });

  const toggleHook = (h: Hook) =>
    run(async () => {
      await api(token, `${base}/webhooks/${h.id}`, { method: "PATCH", body: JSON.stringify({ active: !h.active }) });
      load();
    });

  const testHook = (h: Hook) =>
    run(async () => {
      const d = await api<Delivery | null>(token, `${base}/webhooks/${h.id}/test`, { method: "POST" });
      if (d?.status === "DELIVERED") toast.success(`Test delivered (HTTP ${d.lastStatusCode})`);
      else toast.error(`Test not delivered: ${d?.lastError || "unknown error"}. It will be retried.`);
      load();
      if (showDeliveries) loadDeliveries();
    });

  const replay = (d: Delivery) =>
    run(async () => {
      const out = await api<Delivery>(token, `${base}/webhook-deliveries/${d.id}/replay`, { method: "POST" });
      if (out.status === "DELIVERED") toast.success("Delivered");
      else toast.error(`Still failing: ${out.lastError || "unknown error"}`);
      loadDeliveries();
      load();
    });

  const doConfirm = () =>
    run(async () => {
      if (!confirm) return;
      if (confirm.kind === "revoke") {
        await api(token, `${base}/api-keys/${confirm.id}/revoke`, { method: "POST" });
        toast.success("Key revoked");
      } else if (confirm.kind === "delete") {
        await api(token, `${base}/webhooks/${confirm.id}`, { method: "DELETE" });
        toast.success("Webhook removed");
      } else {
        const out = await api<Hook & { secret: string }>(token, `${base}/webhooks/${confirm.id}/rotate-secret`, { method: "POST" });
        setNewSecret({ label: "new signing secret", value: out.secret });
      }
      setConfirm(null);
      load();
    });

  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <section className="border-t border-gray-100 pt-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-700">API and webhooks</p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          For the partner&apos;s own systems. API docs: <span className="font-mono">swapconnect.africa/developers/partner-api</span>
        </p>
        {!apiEnabled && <p className="text-[11px] text-[#9a6b0f] mt-1">API access is off for this partner. Edit the partner and tick &ldquo;API&rdquo; under Integration types.</p>}
      </div>

      {newSecret && <OneTimeSecret label={newSecret.label} value={newSecret.value} onDone={() => setNewSecret(null)} />}

      {/* Keys */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <KeyRound size={13} /> API keys
          </p>
          {canEdit && (
            <button onClick={() => setKeyForm({ open: true, name: "", scopes: [...scopes], expiresInDays: "" })} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${BTN.secondary}`}>
              <Plus size={12} /> New key
            </button>
          )}
        </div>
        {keys === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-xs text-gray-500">No keys yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {keys.map((k) => (
              <li key={k.id} className={`flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2 ${k.active ? "" : "opacity-60"}`}>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 truncate">{k.name}</span>
                    {!k.active && <Pill className="bg-[#f1f2f4] text-[#5f6672]">{k.revokedAt ? "Revoked" : "Expired"}</Pill>}
                  </span>
                  <span className="block text-[11px] text-gray-500 font-mono">{k.prefix}…</span>
                  <span className="block text-[11px] text-gray-400">
                    {k.scopes.join(", ")} · {k.lastUsedAt ? `last used ${fmtDate(k.lastUsedAt, true)}` : "never used"}
                    {k.expiresAt ? ` · expires ${fmtDate(k.expiresAt)}` : ""}
                  </span>
                </span>
                {canEdit && k.active && (
                  <button onClick={() => setConfirm({ kind: "revoke", id: k.id, label: k.name })} className="text-[11px] text-[#b42318] hover:underline shrink-0">
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Webhooks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Webhook size={13} /> Webhooks
          </p>
          {canEdit && (
            <button
              onClick={() => setHookForm({ open: true, id: null, url: approvedDomains[0] ? `https://${approvedDomains[0]}/` : "https://", events: [] })}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${BTN.secondary}`}
            >
              <Plus size={12} /> Add endpoint
            </button>
          )}
        </div>
        {hooks === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : hooks.length === 0 ? (
          <p className="text-xs text-gray-500">No endpoints. SwapConnect sends signed event notifications to these URLs.</p>
        ) : (
          <ul className="space-y-2">
            {hooks.map((h) => (
              <li key={h.id} className="text-xs border border-gray-100 rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[11px] text-gray-800 break-all">{h.url}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      {h.events.length ? h.events.join(", ") : "All events"} · secret {h.secretHint}
                    </span>
                    {h.stats && (
                      <span className="block text-[11px] text-gray-400 mt-0.5">
                        {h.stats.deliveredLast7Days} delivered (7 days)
                        {h.stats.retrying ? <span className="text-[#9a6b0f]"> · {h.stats.retrying} retrying</span> : null}
                        {h.stats.gaveUp ? <span className="text-[#b42318]"> · {h.stats.gaveUp} gave up</span> : null}
                      </span>
                    )}
                  </span>
                  <Pill className={h.active ? "bg-[#e6f9f0] text-[#037F44]" : "bg-[#f1f2f4] text-[#5f6672]"}>{h.active ? "On" : "Off"}</Pill>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
                    <button disabled={busy} onClick={() => testHook(h)} className="inline-flex items-center gap-1 text-[#037F44] hover:underline disabled:opacity-50">
                      <Send size={11} /> Send test
                    </button>
                    <button onClick={() => setHookForm({ open: true, id: h.id, url: h.url, events: h.events })} className="text-gray-600 hover:underline">
                      Edit
                    </button>
                    <button disabled={busy} onClick={() => toggleHook(h)} className="text-gray-600 hover:underline">
                      {h.active ? "Turn off" : "Turn on"}
                    </button>
                    <button onClick={() => setConfirm({ kind: "rotate", id: h.id, label: h.url })} className="inline-flex items-center gap-1 text-gray-600 hover:underline">
                      <RotateCw size={11} /> New secret
                    </button>
                    <button onClick={() => setConfirm({ kind: "delete", id: h.id, label: h.url })} className="inline-flex items-center gap-1 text-[#b42318] hover:underline">
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delivery log */}
      <div>
        <button onClick={() => setShowDeliveries((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-gray-700">
          {showDeliveries ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Delivery history
        </button>
        {showDeliveries && (
          <div className="mt-2">
            <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] bg-white mb-2">
              <option value="">All</option>
              {(Object.keys(DELIVERY_STYLE) as Delivery["status"][]).map((s) => (
                <option key={s} value={s}>
                  {DELIVERY_STYLE[s].label}
                </option>
              ))}
            </select>
            {deliveries === null ? (
              <p className="text-xs text-gray-400">Loading…</p>
            ) : deliveries.length === 0 ? (
              <p className="text-xs text-gray-500">No deliveries.</p>
            ) : (
              <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {deliveries.map((d) => (
                  <li key={d.id} className="text-[11px] border border-gray-100 rounded-lg px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-800 flex-1 min-w-0 truncate">{d.eventType}</span>
                      <Pill className={DELIVERY_STYLE[d.status].cls}>{DELIVERY_STYLE[d.status].label}</Pill>
                    </div>
                    <p className="text-gray-500 mt-0.5">
                      {fmtDate(d.createdAt, true)} · {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                      {d.lastStatusCode ? ` · HTTP ${d.lastStatusCode}` : ""}
                      {d.status === "FAILED" && d.nextAttemptAt ? ` · next try ${fmtDate(d.nextAttemptAt, true)}` : ""}
                    </p>
                    {d.lastError && d.status !== "DELIVERED" && <p className="text-[#b42318] break-words">{d.lastError}</p>}
                    <div className="flex gap-3 mt-1">
                      <button onClick={() => setOpenPayload(openPayload === d.id ? null : d.id)} className="text-gray-600 hover:underline">
                        {openPayload === d.id ? "Hide" : "Show"} payload
                      </button>
                      {canEdit && d.status !== "PENDING" && (
                        <button disabled={busy} onClick={() => replay(d)} className="text-[#037F44] hover:underline disabled:opacity-50">
                          Send again
                        </button>
                      )}
                    </div>
                    {openPayload === d.id && <pre className="mt-1.5 bg-[#f7f8fb] rounded p-2 overflow-x-auto text-[10.5px]">{JSON.stringify(d.payload, null, 2)}</pre>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Sheet
        open={keyForm.open}
        title="New API key"
        onClose={() => setKeyForm({ ...keyForm, open: false })}
        footer={
          <>
            <button onClick={() => setKeyForm({ ...keyForm, open: false })} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Cancel
            </button>
            <button onClick={createKey} disabled={busy} className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${BTN.primary}`}>
              Create key
            </button>
          </>
        }
      >
        <Field label="Name" required hint="Say where it's used, e.g. “Rently production server”.">
          <input className={INPUT} value={keyForm.name} onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} maxLength={80} />
        </Field>
        <div>
          <span className="block text-xs font-semibold text-gray-700 mb-1.5">What it can do</span>
          <div className="space-y-1.5">
            {scopes.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="accent-[#037F44]" checked={keyForm.scopes.includes(s)} onChange={() => setKeyForm({ ...keyForm, scopes: toggleIn(keyForm.scopes, s) })} />
                {SCOPE_LABEL[s] || s}
              </label>
            ))}
          </div>
        </div>
        <Field label="Expires after (days)" hint="Optional, 1 to 730. Leave blank for no expiry.">
          <input className={INPUT} inputMode="numeric" value={keyForm.expiresInDays} onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: e.target.value.replace(/\D/g, "") })} />
        </Field>
      </Sheet>

      <Sheet
        open={hookForm.open}
        title={hookForm.id ? "Edit webhook" : "Add webhook endpoint"}
        onClose={() => setHookForm({ ...hookForm, open: false })}
        footer={
          <>
            <button onClick={() => setHookForm({ ...hookForm, open: false })} className={`text-sm px-4 py-2 rounded-lg ${BTN.secondary}`}>
              Cancel
            </button>
            <button onClick={saveHook} disabled={busy} className={`text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-60 ${BTN.primary}`}>
              {busy ? "Checking…" : "Save"}
            </button>
          </>
        }
      >
        <Field label="Endpoint URL" required hint={`https only, on an approved domain (${approvedDomains.join(", ") || "none set yet"}).`}>
          <input className={INPUT} value={hookForm.url} onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })} />
        </Field>
        <div>
          <span className="block text-xs font-semibold text-gray-700 mb-1">Events</span>
          <p className="text-[11px] text-gray-500 mb-2">None selected means every event.</p>
          <div className="flex flex-wrap gap-1.5">
            {eventTypes.map((e) => (
              <label key={e} className={`text-[11px] font-mono px-2.5 py-1 rounded-full border cursor-pointer ${hookForm.events.includes(e) ? "border-[#037F44] bg-[#e6f9f0] text-[#037F44]" : "border-gray-200 text-gray-600"}`}>
                <input type="checkbox" className="sr-only" checked={hookForm.events.includes(e)} onChange={() => setHookForm({ ...hookForm, events: toggleIn(hookForm.events, e) })} />
                {e}
              </label>
            ))}
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "revoke" ? "Revoke this key?" : confirm?.kind === "delete" ? "Remove this webhook?" : "Issue a new signing secret?"}
        message={
          confirm?.kind === "revoke"
            ? `"${confirm.label}" stops working immediately. Anything using it will get 401 errors.`
            : confirm?.kind === "delete"
              ? "No more events are sent to it. Its delivery history is kept."
              : "The old secret stops working at once. The partner must switch to the new one to keep verifying signatures."
        }
        confirmLabel={confirm?.kind === "revoke" ? "Revoke" : confirm?.kind === "delete" ? "Remove" : "Issue new secret"}
        variant="danger"
        loading={busy}
        onConfirm={doConfirm}
        onClose={() => setConfirm(null)}
      />
    </section>
  );
}
