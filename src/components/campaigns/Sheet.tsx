"use client";

import { useEffect, useRef, useState } from "react";
import { X, ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "./campaignLabels";

// Shared building blocks for the campaign-integration forms: a dialog that
// is a bottom sheet on phones and a centred panel on desktop, labelled
// fields, and an image picker that uploads through the admin API.

export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`bg-white w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92vh] sm:max-h-[88vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-[#353535]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">{children}</div>
        <div className="px-5 py-3 border-t border-gray-100 flex gap-3 justify-end shrink-0">{footer}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-[#b42318]"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray-500 mt-1 leading-snug">{hint}</span>}
    </label>
  );
}

export const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#037F44] focus:ring-2 focus:ring-[#037F44]/15";

export function ImagePicker({
  token,
  value,
  onChange,
  label,
  uploadPath = "/uploads",
}: {
  token: string | null;
  value: string;
  onChange: (url: string) => void;
  label: string;
  uploadPath?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const out = await api<{ url: string }>(token, uploadPath, { method: "POST", body: fd });
      onChange(out.url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-lg border border-gray-200 bg-[#f7f8fb] overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageUp size={18} className="text-gray-400" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 inline-flex items-center gap-1.5 disabled:opacity-60">
            {busy && <Loader2 size={13} className="animate-spin" />}
            {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-xs text-gray-500 hover:text-[#b42318] px-1">
              Remove
            </button>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}>{children}</span>;
}
