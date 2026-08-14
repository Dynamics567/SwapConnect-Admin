"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Upload, Copy, Trash2, X, Check } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRole } from "@/hooks/useRole";

interface MediaItem {
  id: number;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  altText: string | null;
  createdAt: string;
  UploadedByAdmin?: { firstName: string; lastName: string };
}

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canDelete = isAdmin || isSuperAdmin;

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<{ usedIn: { title: string }[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ limit: "60" });
    if (search) params.set("search", search);
    const res = await fetch(`${API_URL}/api/admin/blog/media?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setMedia(json.data?.media ?? []);
    setLoading(false);
  }, [token, search]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`${API_URL}/api/admin/blog/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      await fetchMedia();
    } finally {
      setUploading(false);
    }
  };

  const openDetail = (item: MediaItem) => {
    setSelected(item);
    setAltText(item.altText || "");
    setDeleteWarning(null);
  };

  const saveAltText = async () => {
    if (!token || !selected) return;
    await fetch(`${API_URL}/api/admin/blog/media/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ altText }),
    });
    await fetchMedia();
  };

  const copyUrl = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const attemptDelete = async (force = false) => {
    if (!token || !selected) return;
    const res = await fetch(`${API_URL}/api/admin/blog/media/${selected.id}${force ? "?force=true" : ""}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 409) {
      const json = await res.json();
      setDeleteWarning(json.data);
      return;
    }
    setSelected(null);
    setConfirmDelete(false);
    setDeleteWarning(null);
    await fetchMedia();
  };

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-[#353535]">Media Library</h1>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <Upload size={15} /> {uploading ? "Uploading…" : "Upload Image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#037F44]"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#9ca3af]">Loading…</div>
        ) : media.length === 0 ? (
          <div className="text-center py-20 text-[#9ca3af]">No media uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {media.map((item) => (
              <button
                key={item.id}
                onClick={() => openDetail(item)}
                className="relative aspect-square rounded-lg overflow-hidden border border-[#e5e7eb] hover:border-[#037F44] transition-colors group bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.fileName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#353535]">Media Details</h2>
              <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#353535]">
                <X size={16} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.altText || selected.fileName} className="w-full rounded-lg mb-4" />
            <p className="text-xs text-[#9ca3af] mb-1">{selected.fileName}</p>
            <p className="text-xs text-[#9ca3af] mb-4">
              {formatBytes(selected.size)} · {new Date(selected.createdAt).toLocaleDateString("en-NG")}
              {selected.UploadedByAdmin && ` · ${selected.UploadedByAdmin.firstName} ${selected.UploadedByAdmin.lastName}`}
            </p>

            <label className="text-xs text-[#6b6b6b] block mb-1">Alt text</label>
            <div className="flex gap-2 mb-4">
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="flex-1 border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#037F44]"
              />
              <button onClick={saveAltText} className="text-xs font-semibold text-[#037F44] px-2">Save</button>
            </div>

            <button
              onClick={copyUrl}
              className="w-full flex items-center justify-center gap-1.5 border border-[#e5e7eb] rounded-lg py-2 text-sm font-semibold text-[#505050] hover:bg-[#F7F8FB] mb-2"
            >
              {copied ? <Check size={14} className="text-[#037F44]" /> : <Copy size={14} />} {copied ? "Copied!" : "Copy URL"}
            </button>

            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 rounded-lg py-2 text-sm font-semibold hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}

            {deleteWarning && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">This image is used in {deleteWarning.usedIn.length} post(s):</p>
                <ul className="list-disc pl-4 mb-2">
                  {deleteWarning.usedIn.map((p, i) => <li key={i}>{p.title}</li>)}
                </ul>
                <button
                  onClick={() => attemptDelete(true)}
                  className="text-red-700 font-semibold underline"
                >
                  Delete anyway
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this image?"
        message="This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => attemptDelete(false)}
        onClose={() => setConfirmDelete(false)}
      />
    </ProtectedRoute>
  );
}
