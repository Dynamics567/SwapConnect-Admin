"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusCircle, Search, Eye, Archive, Trash2, CheckCircle2, RotateCcw,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRole } from "@/hooks/useRole";

type Status = "draft" | "in_review" | "scheduled" | "published" | "archived";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: Status;
  views: number;
  likes: number;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  Author?: { firstName: string; lastName: string };
  Category?: { id: number; name: string };
}

const STATUS_TABS: { key: Status | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "in_review", label: "In Review" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
];

const STATUS_BADGE: Record<Status, string> = {
  draft: "bg-gray-100 text-gray-600",
  in_review: "bg-blue-100 text-blue-800",
  scheduled: "bg-[#fef9ec] text-[#a9791f]",
  published: "bg-[#e6f9f0] text-[#037f44]",
  archived: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft", in_review: "In Review", scheduled: "Scheduled", published: "Published", archived: "Archived",
};

function PostsPageInner() {
  const token = useAuthToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isSuperAdmin } = useRole();
  const canPublish = isAdmin || isSuperAdmin;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status | "">((searchParams.get("status") as Status) || "");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<{ action: string; label: string } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`${API_URL}/api/admin/blog/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setPosts(json.data?.posts ?? []);
      setTotalPages(json.data?.pagination?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [token, page, status, search, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === posts.length ? new Set() : new Set(posts.map((p) => p.id))));
  };

  const runBulk = async (action: string) => {
    if (!token || selected.size === 0) return;
    setBulkLoading(true);
    try {
      await fetch(`${API_URL}/api/admin/blog/posts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postIds: Array.from(selected), action }),
      });
      setSelected(new Set());
      await fetchPosts();
    } finally {
      setBulkLoading(false);
      setConfirm(null);
    }
  };

  const quickStatusAction = async (postId: number, action: string) => {
    if (!token) return;
    await fetch(`${API_URL}/api/admin/blog/posts/${postId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    await fetchPosts();
  };

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-[#353535]">Blog Posts</h1>
          <Link
            href="/dashboard/blog/posts/new"
            className="flex items-center gap-2 bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <PlusCircle size={16} /> Create Post
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow p-1 w-fit overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                status === tab.key ? "bg-[#037F44] text-white" : "text-[#6b6b6b] hover:bg-[#F7F8FB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search posts…"
              className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#037F44]"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#353535]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_viewed">Most Viewed</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && canPublish && (
          <div className="flex items-center gap-3 bg-white rounded-lg shadow px-4 py-3 flex-wrap">
            <span className="text-sm font-medium text-[#353535]">{selected.size} selected</span>
            <button
              onClick={() => runBulk("publish")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#037F44] bg-[#e6f9f0] px-3 py-1.5 rounded-lg hover:bg-[#d1f0e0] disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> Publish
            </button>
            <button
              onClick={() => runBulk("archive")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#a9791f] bg-[#fef9ec] px-3 py-1.5 rounded-lg hover:bg-[#fbf0d3] disabled:opacity-50"
            >
              <Archive size={13} /> Archive
            </button>
            <button
              onClick={() => setConfirm({ action: "delete", label: `Delete ${selected.size} post(s)?` })}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {canPublish && (
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={posts.length > 0 && selected.size === posts.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Author</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Views</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No posts found. Create your first one.</td></tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    {canPublish && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/blog/posts/${post.id}/edit`} className="font-medium text-[#353535] hover:text-[#037F44] line-clamp-1">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {post.Author ? `${post.Author.firstName} ${post.Author.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{post.Category?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_BADGE[post.status]}`}>
                        {STATUS_LABEL[post.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 flex items-center gap-1">
                      <Eye size={12} /> {post.views}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {post.status === "scheduled" && post.scheduledFor
                        ? new Date(post.scheduledFor).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                        : new Date(post.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      {canPublish && (
                        <div className="flex items-center gap-1">
                          {post.status !== "published" && post.status !== "archived" && (
                            <button
                              title="Publish"
                              onClick={() => quickStatusAction(post.id, "publish")}
                              className="text-[#037F44] hover:bg-[#e6f9f0] p-1.5 rounded-lg"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          {post.status === "published" && (
                            <button
                              title="Archive"
                              onClick={() => quickStatusAction(post.id, "archive")}
                              className="text-[#a9791f] hover:bg-[#fef9ec] p-1.5 rounded-lg"
                            >
                              <Archive size={15} />
                            </button>
                          )}
                          {post.status === "archived" && (
                            <button
                              title="Restore"
                              onClick={() => quickStatusAction(post.id, "restore")}
                              className="text-[#037F44] hover:bg-[#e6f9f0] p-1.5 rounded-lg"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  p === page ? "bg-[#037F44] text-white" : "bg-white text-[#6b6b6b] hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.label ?? ""}
        message="This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        loading={bulkLoading}
        onConfirm={() => confirm && runBulk(confirm.action)}
        onClose={() => setConfirm(null)}
      />
    </ProtectedRoute>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="pt-[110px] pl-8 text-[#6b6b6b]">Loading…</div>}>
      <PostsPageInner />
    </Suspense>
  );
}
