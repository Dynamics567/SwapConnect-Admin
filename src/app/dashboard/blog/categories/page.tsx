"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, X, Combine } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRole } from "@/hooks/useRole";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  postCount: number;
}
interface TagItem {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}

const EMPTY_CATEGORY_FORM = { name: "", description: "", image: "", seoTitle: "", seoDescription: "" };

export default function CategoriesTagsPage() {
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canManage = isAdmin || isSuperAdmin;

  const [tab, setTab] = useState<"categories" | "tags">("categories");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catForm, setCatForm] = useState(EMPTY_CATEGORY_FORM);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);

  // Tags
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagLoading, setTagLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [renamingTag, setRenamingTag] = useState<{ id: number; name: string } | null>(null);
  const [deleteTagTarget, setDeleteTagTarget] = useState<TagItem | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<Set<number>>(new Set());
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setCatLoading(true);
    const res = await fetch(`${API_URL}/api/admin/blog/categories`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setCategories(json.data ?? []);
    setCatLoading(false);
  }, [token]);

  const fetchTags = useCallback(async () => {
    if (!token) return;
    setTagLoading(true);
    const res = await fetch(`${API_URL}/api/admin/blog/tags`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setTags(json.data ?? []);
    setTagLoading(false);
  }, [token]);

  useEffect(() => { fetchCategories(); fetchTags(); }, [fetchCategories, fetchTags]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatForm(EMPTY_CATEGORY_FORM);
    setShowCatForm(true);
  };
  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatForm({ name: cat.name, description: cat.description || "", image: cat.image || "", seoTitle: "", seoDescription: "" });
    setShowCatForm(true);
  };

  const saveCategory = async () => {
    if (!token || !catForm.name.trim()) return;
    setCatSaving(true);
    try {
      const url = editingCategory
        ? `${API_URL}/api/admin/blog/categories/${editingCategory.id}`
        : `${API_URL}/api/admin/blog/categories`;
      await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(catForm),
      });
      setShowCatForm(false);
      await fetchCategories();
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!token || !deleteCatTarget) return;
    await fetch(`${API_URL}/api/admin/blog/categories/${deleteCatTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteCatTarget(null);
    await fetchCategories();
  };

  const createTag = async () => {
    if (!token || !newTagName.trim()) return;
    await fetch(`${API_URL}/api/admin/blog/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTagName.trim() }),
    });
    setNewTagName("");
    await fetchTags();
  };

  const renameTag = async () => {
    if (!token || !renamingTag) return;
    await fetch(`${API_URL}/api/admin/blog/tags/${renamingTag.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: renamingTag.name }),
    });
    setRenamingTag(null);
    await fetchTags();
  };

  const deleteTag = async () => {
    if (!token || !deleteTagTarget) return;
    await fetch(`${API_URL}/api/admin/blog/tags/${deleteTagTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteTagTarget(null);
    await fetchTags();
  };

  const toggleMergeSelect = (id: number) => {
    setMergeSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmMerge = async () => {
    if (!token || mergeSelection.size === 0 || !mergeTarget) return;
    await fetch(`${API_URL}/api/admin/blog/tags/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sourceTagIds: Array.from(mergeSelection), targetTagId: mergeTarget }),
    });
    setMergeMode(false);
    setMergeSelection(new Set());
    setMergeTarget(null);
    await fetchTags();
  };

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <h1 className="text-2xl font-bold text-[#353535]">Categories & Tags</h1>

        <div className="flex items-center gap-1 bg-white rounded-lg shadow p-1 w-fit">
          <button
            onClick={() => setTab("categories")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab === "categories" ? "bg-[#037F44] text-white" : "text-[#6b6b6b]"}`}
          >
            Categories
          </button>
          <button
            onClick={() => setTab("tags")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab === "tags" ? "bg-[#037F44] text-white" : "text-[#6b6b6b]"}`}
          >
            Tags
          </button>
        </div>

        {tab === "categories" ? (
          <>
            {canManage && (
              <div className="flex justify-end">
                <button
                  onClick={openCreateCategory}
                  className="flex items-center gap-2 bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm px-4 py-2.5 rounded-lg"
                >
                  <PlusCircle size={16} /> New Category
                </button>
              </div>
            )}
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Slug</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Posts</th>
                    {canManage && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {catLoading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
                  ) : categories.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">No categories yet.</td></tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-[#353535]">{cat.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                        <td className="px-4 py-3 text-gray-500 line-clamp-1">{cat.description || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{cat.postCount}</td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditCategory(cat)} className="text-[#505050] hover:bg-gray-100 p-1.5 rounded-lg">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeleteCatTarget(cat)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {canManage && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createTag()}
                    placeholder="New tag name"
                    className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#037F44]"
                  />
                  <button onClick={createTag} className="bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm px-4 py-2 rounded-lg">
                    Add Tag
                  </button>
                </div>
                <button
                  onClick={() => { setMergeMode((v) => !v); setMergeSelection(new Set()); setMergeTarget(null); }}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
                    mergeMode ? "bg-[#037F44] text-white border-[#037F44]" : "border-[#e5e7eb] text-[#505050]"
                  }`}
                >
                  <Combine size={14} /> {mergeMode ? "Cancel Merge" : "Merge Tags"}
                </button>
              </div>
            )}

            {mergeMode && (
              <div className="bg-white rounded-lg shadow p-4 text-sm">
                <p className="text-[#6b6b6b] mb-2">
                  Select tags to merge, then choose which tag they become. Selected tags will be deleted; their posts keep the target tag.
                </p>
                {mergeSelection.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6b6b6b]">Merge into:</span>
                    <select
                      value={mergeTarget ?? ""}
                      onChange={(e) => setMergeTarget(Number(e.target.value))}
                      className="border border-[#e5e7eb] rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="">Select target tag…</option>
                      {tags.filter((t) => !mergeSelection.has(t.id)).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={confirmMerge}
                      disabled={!mergeTarget}
                      className="bg-[#037F44] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Confirm Merge ({mergeSelection.size})
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {mergeMode && <th className="px-4 py-3 w-8" />}
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Slug</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Posts</th>
                    {canManage && !mergeMode && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tagLoading ? (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr>
                  ) : tags.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-400">No tags yet.</td></tr>
                  ) : (
                    tags.map((tag) => (
                      <tr key={tag.id} className="hover:bg-gray-50">
                        {mergeMode && (
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={mergeSelection.has(tag.id)} onChange={() => toggleMergeSelect(tag.id)} />
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium text-[#353535]">
                          {renamingTag?.id === tag.id ? (
                            <input
                              autoFocus
                              value={renamingTag.name}
                              onChange={(e) => setRenamingTag({ id: tag.id, name: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && renameTag()}
                              onBlur={renameTag}
                              className="border border-[#037F44] rounded px-2 py-0.5 text-sm"
                            />
                          ) : (
                            tag.name
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{tag.slug}</td>
                        <td className="px-4 py-3 text-gray-500">{tag.postCount}</td>
                        {canManage && !mergeMode && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setRenamingTag({ id: tag.id, name: tag.name })} className="text-[#505050] hover:bg-gray-100 p-1.5 rounded-lg">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeleteTagTarget(tag)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Category create/edit drawer */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editingCategory ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setShowCatForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <input
                  value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Image URL</label>
                <input
                  value={catForm.image}
                  onChange={(e) => setCatForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">SEO Title</label>
                <input
                  value={catForm.seoTitle}
                  onChange={(e) => setCatForm((f) => ({ ...f, seoTitle: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">SEO Description</label>
                <textarea
                  value={catForm.seoDescription}
                  onChange={(e) => setCatForm((f) => ({ ...f, seoDescription: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <button
              onClick={saveCategory}
              disabled={catSaving}
              className="w-full bg-[#037F44] text-white py-3 rounded-lg font-semibold mt-6 hover:bg-[#026835] disabled:opacity-60"
            >
              {catSaving ? "Saving…" : "Save Category"}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteCatTarget}
        title={`Delete "${deleteCatTarget?.name}"?`}
        message="Posts in this category will become uncategorized. This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={deleteCategory}
        onClose={() => setDeleteCatTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTagTarget}
        title={`Delete "${deleteTagTarget?.name}"?`}
        message="This tag will be removed from all posts. This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={deleteTag}
        onClose={() => setDeleteTagTarget(null)}
      />
    </ProtectedRoute>
  );
}
