"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Send, CalendarClock, Eye, ImagePlus, FolderOpen, X, Tag as TagIcon,
  CheckCircle2, AlertTriangle, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import RichTextEditor from "./RichTextEditor";
import PreviewModal from "./PreviewModal";
import MediaPickerModal from "./MediaPickerModal";
import { computeSeoScore, computeContentQualityScore, type PostDraftForScoring } from "@/lib/blogContentScore";

interface Category {
  id: number;
  name: string;
}
interface TagOption {
  id: number;
  name: string;
}

interface PostEditorProps {
  postId?: number;
}

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: "",
  categoryId: null as number | null,
  tagIds: [] as number[],
  coverImageUrl: "",
  coverImageAlt: "",
  coverImageCaption: "",
  seoTitle: "",
  seoDescription: "",
  focusKeyword: "",
  secondaryKeywords: "",
  canonicalUrl: "",
};

type FormState = typeof EMPTY_FORM;

export default function PostEditor({ postId }: PostEditorProps) {
  const token = useAuthToken();
  const router = useRouter();
  const isEdit = !!postId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<string>("draft");
  const [slug, setSlug] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:30");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/blog/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setCategories(json.data ?? []));
    fetch(`${API_URL}/api/admin/blog/tags`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setTags(json.data ?? []));
  }, [token]);

  useEffect(() => {
    if (!token || !postId) return;
    setLoading(true);
    fetch(`${API_URL}/api/admin/blog/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        const post = json.data;
        if (!post) return;
        setForm({
          title: post.title || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          categoryId: post.categoryId ?? null,
          tagIds: (post.Tags ?? []).map((t: TagOption) => t.id),
          coverImageUrl: post.coverImageUrl || "",
          coverImageAlt: post.coverImageAlt || "",
          coverImageCaption: post.coverImageCaption || "",
          seoTitle: post.seoTitle || "",
          seoDescription: post.seoDescription || "",
          focusKeyword: post.focusKeyword || "",
          secondaryKeywords: (post.secondaryKeywords ?? []).join(", "),
          canonicalUrl: post.canonicalUrl || "",
        });
        setStatus(post.status);
        setSlug(post.slug);
      })
      .finally(() => setLoading(false));
  }, [token, postId]);

  const uploadFile = useCallback(async (file: File): Promise<{ url: string } | null> => {
    if (!token) return null;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/admin/blog/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return { url: json.data.url };
  }, [token]);

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const result = await uploadFile(file);
      if (result?.url) set("coverImageUrl", result.url);
    } finally {
      setUploadingCover(false);
    }
  };

  const buildPayload = () => ({
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    categoryId: form.categoryId,
    tagIds: form.tagIds,
    coverImageUrl: form.coverImageUrl || null,
    coverImageAlt: form.coverImageAlt || null,
    coverImageCaption: form.coverImageCaption || null,
    seoTitle: form.seoTitle || null,
    seoDescription: form.seoDescription || null,
    focusKeyword: form.focusKeyword || null,
    secondaryKeywords: form.secondaryKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    canonicalUrl: form.canonicalUrl || null,
  });

  const savePost = async (): Promise<number | null> => {
    if (!token || !form.title.trim()) {
      setError("A title is required.");
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      const url = isEdit ? `${API_URL}/api/admin/blog/posts/${postId}` : `${API_URL}/api/admin/blog/posts`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Failed to save post.");
        return null;
      }
      if (!isEdit) {
        setSlug(json.data.slug);
        router.replace(`/dashboard/blog/posts/${json.data.id}/edit`);
      }
      return json.data.id;
    } catch {
      setError("Something went wrong. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runStatusAction = async (action: string, extra?: Record<string, unknown>) => {
    const id = await savePost();
    if (!id || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/blog/posts/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || `Failed to ${action}.`);
        return;
      }
      setStatus(json.data.status);
      setScheduleOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = () => {
    if (!scheduleDate) {
      setError("Pick a date to schedule for.");
      return;
    }
    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    runStatusAction("schedule", { scheduledFor });
  };

  const scoring: PostDraftForScoring = {
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    focusKeyword: form.focusKeyword,
    coverImageUrl: form.coverImageUrl,
    coverImageAlt: form.coverImageAlt,
    categoryId: form.categoryId,
  };
  const seo = computeSeoScore(scoring);
  const quality = computeContentQualityScore(scoring);
  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  if (loading) {
    return <div className="text-[#6b6b6b]">Loading…</div>;
  }

  return (
    <div className="w-full pb-14">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#353535]">{isEdit ? "Edit Post" : "Create Post"}</h1>
          {isEdit && <p className="text-xs text-[#9ca3af] mt-0.5">/{slug}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#505050] border border-[#e5e7eb] px-3.5 py-2 rounded-lg hover:bg-white transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => savePost()}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#505050] border border-[#e5e7eb] px-3.5 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            <Save size={14} /> Save Draft
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-white rounded-xl shadow p-5">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Article title"
              className="w-full text-2xl font-bold text-[#353535] placeholder:text-[#c4c4c4] focus:outline-none mb-3"
            />
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="A short subtitle or excerpt for this post…"
              rows={2}
              className="w-full text-sm text-[#6b6b6b] placeholder:text-[#c4c4c4] focus:outline-none resize-none border-t border-[#f3f4f6] pt-3"
            />
          </div>

          <RichTextEditor
            content={form.content}
            onChange={(html) => set("content", html)}
            onUploadImage={uploadFile}
            placeholder="Start writing your story…"
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          {/* Publish panel */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#353535]">Publish</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F7F8FB] text-[#6b6b6b] capitalize">
                {status.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => runStatusAction("publish")}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish Now
              </button>
              <button
                onClick={() => setScheduleOpen((v) => !v)}
                className="flex items-center justify-center gap-1.5 border border-[#e5e7eb] text-[#505050] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#F7F8FB] transition-colors"
              >
                <CalendarClock size={14} /> Schedule
              </button>
              {scheduleOpen && (
                <div className="flex flex-col gap-2 border border-[#e5e7eb] rounded-lg p-3 mt-1">
                  <label className="text-xs text-[#6b6b6b]">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm"
                  />
                  <label className="text-xs text-[#6b6b6b]">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm"
                  />
                  <button
                    onClick={handleSchedule}
                    disabled={saving}
                    className="bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm py-2 rounded-lg mt-1 disabled:opacity-50"
                  >
                    Confirm Schedule
                  </button>
                </div>
              )}
              {status === "published" && (
                <button
                  onClick={() => runStatusAction("unpublish")}
                  className="text-xs text-[#9ca3af] hover:text-[#505050] mt-1"
                >
                  Unpublish (back to draft)
                </button>
              )}
              {status === "archived" && (
                <button
                  onClick={() => runStatusAction("restore")}
                  className="text-xs text-[#037F44] hover:text-[#026835] mt-1"
                >
                  Restore from archive
                </button>
              )}
            </div>
          </div>

          {/* Featured image */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm font-bold text-[#353535] mb-3">Featured Image</h3>
            {form.coverImageUrl ? (
              <div className="relative mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />
                <button
                  onClick={() => set("coverImageUrl", "")}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-[#e5e7eb] shadow flex items-center justify-center text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-[#e5e7eb] rounded-lg py-3 text-xs font-semibold text-[#6b6b6b] hover:border-[#037F44] hover:text-[#037F44] transition-colors disabled:opacity-50"
                >
                  <ImagePlus size={14} /> {uploadingCover ? "Uploading…" : "Upload"}
                </button>
                <button
                  onClick={() => setMediaPickerOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-[#e5e7eb] rounded-lg py-3 text-xs font-semibold text-[#6b6b6b] hover:border-[#037F44] hover:text-[#037F44] transition-colors"
                >
                  <FolderOpen size={14} /> Library
                </button>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
                e.target.value = "";
              }}
            />
            {form.coverImageUrl && (
              <div className="space-y-2">
                <input
                  value={form.coverImageAlt}
                  onChange={(e) => set("coverImageAlt", e.target.value)}
                  placeholder="Alt text (for accessibility & SEO)"
                  className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44]"
                />
                <input
                  value={form.coverImageCaption}
                  onChange={(e) => set("coverImageCaption", e.target.value)}
                  placeholder="Caption (optional)"
                  className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44]"
                />
              </div>
            )}
          </div>

          {/* Category & Tags */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm font-bold text-[#353535] mb-3">Category & Tags</h3>
            <label className="text-xs text-[#6b6b6b] block mb-1">Category</label>
            <select
              value={form.categoryId ?? ""}
              onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-sm mb-3 focus:outline-none focus:border-[#037F44]"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="text-xs text-[#6b6b6b] block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = form.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() =>
                      set("tagIds", active ? form.tagIds.filter((id) => id !== tag.id) : [...form.tagIds, tag.id])
                    }
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      active ? "bg-[#037F44] text-white" : "bg-[#F7F8FB] text-[#6b6b6b] hover:bg-[#eef0f3]"
                    }`}
                  >
                    <TagIcon size={10} /> {tag.name}
                  </button>
                );
              })}
              {tags.length === 0 && <p className="text-xs text-[#9ca3af]">No tags yet — create some in Categories & Tags.</p>}
            </div>
          </div>

          {/* Content Quality Score */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#353535]">Content Quality</h3>
              <span className="text-lg font-bold text-[#037F44]">{quality.score}%</span>
            </div>
            <p className="text-xs font-semibold text-[#6b6b6b] mb-3">{quality.label}</p>
            <ul className="space-y-1.5">
              {quality.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-1.5 text-xs">
                  {c.pass ? (
                    <CheckCircle2 size={13} className="text-[#037F44] mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={13} className="text-[#a9791f] mt-0.5 shrink-0" />
                  )}
                  <span className={c.pass ? "text-[#505050]" : "text-[#9ca3af]"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SEO panel */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#353535]">SEO</h3>
              <span className="text-lg font-bold text-[#037F44]">{seo.score}/100</span>
            </div>
            <div className="space-y-2 mb-3">
              <input
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder="SEO title"
                className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44]"
              />
              <textarea
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                placeholder="Meta description"
                rows={2}
                className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44] resize-none"
              />
              <input
                value={form.focusKeyword}
                onChange={(e) => set("focusKeyword", e.target.value)}
                placeholder="Focus keyword"
                className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44]"
              />
              <input
                value={form.secondaryKeywords}
                onChange={(e) => set("secondaryKeywords", e.target.value)}
                placeholder="Secondary keywords (comma-separated)"
                className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44]"
              />
              <input
                value={form.canonicalUrl}
                onChange={(e) => set("canonicalUrl", e.target.value)}
                placeholder="Canonical URL (optional)"
                className="w-full text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#037F44]"
              />
            </div>
            <ul className="space-y-1.5">
              {seo.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-1.5 text-xs">
                  {c.pass ? (
                    <CheckCircle2 size={13} className="text-[#037F44] mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={13} className="text-[#a9791f] mt-0.5 shrink-0" />
                  )}
                  <span className={c.pass ? "text-[#505050]" : "text-[#9ca3af]"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={form.title}
        excerpt={form.excerpt}
        content={form.content}
        coverImageUrl={form.coverImageUrl}
        coverImageAlt={form.coverImageAlt}
        categoryName={selectedCategory?.name}
      />
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(item) => set("coverImageUrl", item.url)}
      />
    </div>
  );
}
