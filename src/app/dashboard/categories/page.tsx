"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, FolderTree } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ProductAttribute {
  id: number;
  categoryId: number;
  key: string;
  label: string;
  inputType: "text" | "number" | "select" | "boolean";
  options: string[] | null;
  required: boolean;
  sortOrder: number;
}

interface CategoryNode {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  parentId: number | null;
  canBuy: boolean;
  canSell: boolean;
  canSwap: boolean;
  canAuction: boolean;
  canGive: boolean;
  canRecycle: boolean;
  sharpShapSlug: string | null;
  sortOrder: number;
  Attributes: ProductAttribute[];
  children: CategoryNode[];
}

const CAPABILITY_FIELDS: { key: "canBuy" | "canSell" | "canSwap" | "canAuction" | "canGive" | "canRecycle"; label: string }[] = [
  { key: "canBuy", label: "Buy" },
  { key: "canSell", label: "Sell" },
  { key: "canSwap", label: "Swap / Trade-In" },
  { key: "canAuction", label: "Auction" },
  { key: "canGive", label: "Give" },
  { key: "canRecycle", label: "Recycle" },
];

function findNode(nodes: CategoryNode[], id: number): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function CategoryTreeRow({
  node,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggleExpand,
}: {
  node: CategoryNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  expanded: Set<number>;
  onToggleExpand: (id: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: `${12 + depth * 18}px` }}
        className={`w-full flex items-center gap-1.5 py-2 pr-3 text-left text-sm rounded-lg transition-colors ${
          selectedId === node.id ? "bg-[#e6f9f0] text-[#037F44] font-semibold" : "text-[#353535] hover:bg-gray-50"
        }`}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <span className="truncate flex-1">{node.name}</span>
        {!node.canSwap && !node.canAuction && depth === 0 && (
          <span className="text-[10px] text-gray-400 shrink-0">sell-only</span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const token = useAuthToken();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [editForm, setEditForm] = useState({
    name: "", canBuy: true, canSell: true, canSwap: false, canAuction: false, canGive: false, canRecycle: false, sharpShapSlug: "",
  });
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [newAttrLabel, setNewAttrLabel] = useState("");
  const [newAttrType, setNewAttrType] = useState<ProductAttribute["inputType"]>("text");
  const [newAttrOptions, setNewAttrOptions] = useState("");
  const [newAttrRequired, setNewAttrRequired] = useState(false);
  const [savingAttr, setSavingAttr] = useState(false);

  const fetchTree = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTree(Array.isArray(data?.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const selectedNode = selectedId !== null ? findNode(tree, selectedId) : null;

  useEffect(() => {
    if (selectedNode) {
      setEditForm({
        name: selectedNode.name,
        canBuy: selectedNode.canBuy,
        canSell: selectedNode.canSell,
        canSwap: selectedNode.canSwap,
        canAuction: selectedNode.canAuction,
        canGive: selectedNode.canGive,
        canRecycle: selectedNode.canRecycle,
        sharpShapSlug: selectedNode.sharpShapSlug || "",
      });
    }
  }, [selectedNode]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedNode || !token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/categories/${selectedNode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name,
          canBuy: editForm.canBuy,
          canSell: editForm.canSell,
          canSwap: editForm.canSwap,
          canAuction: editForm.canAuction,
          canGive: editForm.canGive,
          canRecycle: editForm.canRecycle,
          sharpShapSlug: editForm.sharpShapSlug || null,
        }),
      });
      await fetchTree();
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = (parentId: number | null) => {
    setCreateParentId(parentId);
    setCreateName("");
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!token || !createName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createName.trim(), parentId: createParentId }),
      });
      const data = await res.json();
      setShowCreateModal(false);
      if (createParentId) setExpanded((prev) => new Set(prev).add(createParentId));
      await fetchTree();
      if (data?.data?.id) setSelectedId(data.data.id);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.message || "Failed to delete category");
        return;
      }
      setDeleteTarget(null);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      await fetchTree();
    } finally {
      setDeleting(false);
    }
  };

  const handleAddAttribute = async () => {
    if (!selectedNode || !token || !newAttrLabel.trim()) return;
    setSavingAttr(true);
    try {
      await fetch(`${API_URL}/api/admin/categories/${selectedNode.id}/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          label: newAttrLabel.trim(),
          inputType: newAttrType,
          options: newAttrType === "select" ? newAttrOptions.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
          required: newAttrRequired,
        }),
      });
      setNewAttrLabel("");
      setNewAttrOptions("");
      setNewAttrRequired(false);
      await fetchTree();
    } finally {
      setSavingAttr(false);
    }
  };

  const handleRemoveAttribute = async (attrId: number) => {
    if (!token) return;
    await fetch(`${API_URL}/api/admin/categories/attributes/${attrId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchTree();
  };

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin"]}>
      <div className="w-full min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#353535]">Categories</h1>
            <p className="text-sm text-[#848484] mt-1">
              Manage the category tree, per-category buy/sell/swap/auction rules, and dynamic listing fields.
            </p>
          </div>
          <button
            onClick={() => openCreateModal(null)}
            className="flex items-center gap-1.5 bg-[#037F44] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#025e2e]"
          >
            <Plus size={15} /> New Category
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Tree */}
            <div className="bg-white rounded-xl shadow p-3">
              {tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <FolderTree size={28} className="mb-2" />
                  <p className="text-sm">No categories yet</p>
                </div>
              ) : (
                tree.map((node) => (
                  <CategoryTreeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    expanded={expanded}
                    onToggleExpand={toggleExpand}
                  />
                ))
              )}
            </div>

            {/* Detail panel */}
            <div className="bg-white rounded-xl shadow p-6">
              {!selectedNode ? (
                <div className="text-center py-20 text-gray-400 text-sm">Select a category to view or edit it.</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{selectedNode.parentId ? "Category" : "Product Type"}</p>
                      <h2 className="text-lg font-bold text-[#353535]">{selectedNode.name}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCreateModal(selectedNode.id)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                      >
                        <Plus size={13} /> Add Child
                      </button>
                      <button
                        onClick={() => { setDeleteError(""); setDeleteTarget(selectedNode); }}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Transaction Capabilities
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CAPABILITY_FIELDS.map((f) => (
                        <label key={f.key} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm[f.key]}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                            className="accent-[#037F44]"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {editForm.canAuction && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        SharpShap Slug (required for auction to actually publish)
                      </label>
                      <select
                        value={editForm.sharpShapSlug}
                        onChange={(e) => setEditForm((f) => ({ ...f, sharpShapSlug: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="">Not set (auction will be blocked)</option>
                        <option value="mobile">mobile</option>
                        <option value="computers">computers</option>
                        <option value="wearables">wearables</option>
                        <option value="gaming">gaming</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#037F44] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#025e2e] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>

                  {/* Attributes */}
                  <div className="border-t pt-5">
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Dynamic Fields on this Category
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      Shown on the sell form for this category, plus every subcategory beneath it.
                    </p>

                    {selectedNode.Attributes.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {selectedNode.Attributes.map((attr) => (
                          <div key={attr.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium">{attr.label}</span>
                              <span className="text-gray-400 ml-2 text-xs">
                                {attr.inputType}
                                {attr.required ? " · required" : ""}
                                {attr.options?.length ? ` · ${attr.options.join(", ")}` : ""}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveAttribute(attr.id)}
                              className="text-gray-400 hover:text-red-500"
                              aria-label={`Remove ${attr.label}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={newAttrLabel}
                          onChange={(e) => setNewAttrLabel(e.target.value)}
                          placeholder="e.g. Charger Type"
                          className="border rounded-lg px-3 py-2 text-sm bg-white"
                        />
                        <select
                          value={newAttrType}
                          onChange={(e) => setNewAttrType(e.target.value as ProductAttribute["inputType"])}
                          className="border rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select (dropdown)</option>
                          <option value="boolean">Yes / No</option>
                        </select>
                      </div>
                      {newAttrType === "select" && (
                        <input
                          value={newAttrOptions}
                          onChange={(e) => setNewAttrOptions(e.target.value)}
                          placeholder="Comma-separated options, e.g. Wall, Wireless, Car"
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                        />
                      )}
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newAttrRequired}
                          onChange={(e) => setNewAttrRequired(e.target.checked)}
                          className="accent-[#037F44]"
                        />
                        Required on the sell form
                      </label>
                      <button
                        onClick={handleAddAttribute}
                        disabled={savingAttr || !newAttrLabel.trim()}
                        className="text-sm bg-white border border-[#037F44] text-[#037F44] px-3 py-1.5 rounded-lg font-medium hover:bg-[#e6f9f0] disabled:opacity-60"
                      >
                        {savingAttr ? "Adding…" : "Add Field"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create category modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
              <h2 className="text-lg font-bold text-[#353535] mb-1">
                {createParentId ? "Add Subcategory" : "New Product Type"}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                {createParentId
                  ? `Nested under ${findNode(tree, createParentId)?.name ?? "this category"}.`
                  : "A top-level category, e.g. \"Phone Accessories\"."}
              </p>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Category name"
                autoFocus
                className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createName.trim()}
                  className="flex-1 px-4 py-2 bg-[#037F44] text-white rounded-lg text-sm font-medium hover:bg-[#025e2e] disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          title={`Delete "${deleteTarget?.name ?? ""}"?`}
          message={
            deleteError || "This can't be undone. Categories with products or subcategories can't be deleted."
          }
          variant="danger"
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
