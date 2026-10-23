"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function SidePanel({
  open, title, onClose, children,
}: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl p-6 animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#353535]">{title}</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#353535] hover:bg-[#f3f4f6] rounded-lg p-1.5">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
      <style jsx global>{`
        @keyframes slideIn { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#f3f4f6] text-sm">
      <span className="text-[#6b7280]">{label}</span>
      <span className="text-[#353535] font-medium text-right">{value}</span>
    </div>
  );
}
