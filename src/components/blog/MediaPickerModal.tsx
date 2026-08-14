"use client";

import { useEffect, useState } from "react";
import { X, Search } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

interface MediaItem {
  id: number;
  url: string;
  fileName: string;
  altText: string | null;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}

export default function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const token = useAuthToken();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    const params = new URLSearchParams({ type: "image", limit: "40" });
    if (search) params.set("search", search);
    fetch(`${API_URL}/api/admin/blog/media?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setItems(json.data?.media ?? []))
      .finally(() => setLoading(false));
  }, [open, token, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <h2 className="text-base font-bold text-[#353535]">Select from Media Library</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#353535] p-1.5 rounded-lg hover:bg-[#f3f4f6]">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-[#e5e7eb]">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media…"
              className="w-full pl-8 pr-3 py-1.5 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#037F44]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-16 text-[#9ca3af]">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-[#9ca3af]">No images found. Upload one first.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item); onClose(); }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-[#e5e7eb] hover:border-[#037F44] transition-colors group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
