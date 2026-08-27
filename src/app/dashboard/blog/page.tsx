"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, CheckCircle2, Clock, CalendarClock, Eye, Heart, Share2,
  PlusCircle, TrendingUp, AlertCircle,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "@/components/ProtectedRoute";

interface OverviewData {
  counts: { total: number; published: number; draft: number; scheduled: number; inReview: number; archived: number };
  engagement: { views: number; likes: number; shares: number };
  activity: { publishedToday: number; scheduled: number; drafts: number; pendingReview: number };
  performance: {
    mostViewed: { id: number; title: string; slug: string; views: number } | null;
    mostShared: { id: number; title: string; slug: string; shares: number } | null;
    mostLiked: { id: number; title: string; slug: string; likes: number } | null;
  };
  recentPublications: { id: number; title: string; publishedAt: string; views: number; Author?: { firstName: string; lastName: string } }[];
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-3">
      <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center shrink-0">{icon}</span>
      <div>
        <div className="text-xs md:text-sm text-[#6b6b6b] mb-1">{label}</div>
        <div className="md:text-2xl text-lg font-bold text-[#353535]">{value}</div>
      </div>
    </div>
  );
}

function ActivityRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[#F7F8FB] transition-colors"
    >
      <span className="text-sm text-[#505050]">{label}</span>
      <span className="text-sm font-bold text-[#353535] bg-[#F7F8FB] rounded-full px-3 py-0.5">{value}</span>
    </Link>
  );
}

function PerformanceCard({
  title, post, metric, metricLabel,
}: {
  title: string;
  post: { title: string; slug: string } | null;
  metric: number | undefined;
  metricLabel: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-2">{title}</p>
      {post ? (
        <>
          <p className="text-sm font-bold text-[#353535] line-clamp-2 mb-1">{post.title}</p>
          <p className="text-xs text-[#037F44] font-medium">
            {metric ?? 0} {metricLabel}
          </p>
        </>
      ) : (
        <p className="text-sm text-[#9ca3af]">No published posts yet</p>
      )}
    </div>
  );
}

export default function BlogOverviewPage() {
  const token = useAuthToken();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/admin/blog/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => setData(json.data ?? null))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#353535]">Content & Blog</h1>
            <p className="text-sm text-[#6b6b6b] mt-1">Your publishing workflow, at a glance.</p>
          </div>
          <Link
            href="/dashboard/blog/posts/new"
            className="flex items-center gap-2 bg-[#037F44] hover:bg-[#026835] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <PlusCircle size={16} /> Create Post
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#6b6b6b]">Loading…</div>
        ) : !data ? (
          <div className="text-center py-20 text-[#9ca3af]">Couldn&apos;t load overview data.</div>
        ) : (
          <>
            {/* Content statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<FileText size={22} className="text-[#037F44]" />} label="Total Posts" value={data.counts.total} />
              <StatCard icon={<CheckCircle2 size={22} className="text-[#037F44]" />} label="Published" value={data.counts.published} />
              <StatCard icon={<Clock size={22} className="text-[#037F44]" />} label="Drafts" value={data.counts.draft} />
              <StatCard icon={<CalendarClock size={22} className="text-[#037F44]" />} label="Scheduled" value={data.counts.scheduled} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={<Eye size={22} className="text-[#037F44]" />} label="Total Views" value={data.engagement.views.toLocaleString()} />
              <StatCard icon={<Heart size={22} className="text-[#037F44]" />} label="Total Likes" value={data.engagement.likes.toLocaleString()} />
              <StatCard icon={<Share2 size={22} className="text-[#037F44]" />} label="Total Shares" value={data.engagement.shares.toLocaleString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content activity -- actionable, links straight into a filtered Posts view */}
              <div className="bg-white rounded-lg shadow lg:col-span-1">
                <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#037F44]" />
                  <h2 className="text-sm font-bold text-[#353535]">Content Activity</h2>
                </div>
                <div className="flex flex-col pb-2">
                  <ActivityRow label="Published today" value={data.activity.publishedToday} href="/dashboard/blog/posts?status=published" />
                  <ActivityRow label="Scheduled" value={data.activity.scheduled} href="/dashboard/blog/posts?status=scheduled" />
                  <ActivityRow label="Drafts" value={data.activity.drafts} href="/dashboard/blog/posts?status=draft" />
                  <ActivityRow label="Pending review" value={data.activity.pendingReview} href="/dashboard/blog/posts?status=in_review" />
                </div>
              </div>

              {/* Performance */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PerformanceCard title="Most Viewed" post={data.performance.mostViewed} metric={data.performance.mostViewed?.views} metricLabel="views" />
                <PerformanceCard title="Most Shared" post={data.performance.mostShared} metric={data.performance.mostShared?.shares} metricLabel="shares" />
                <PerformanceCard title="Most Engaging" post={data.performance.mostLiked} metric={data.performance.mostLiked?.likes} metricLabel="likes" />
              </div>
            </div>

            {/* Recent publications */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-sm font-bold text-[#353535]">Recent Publications</h2>
              </div>
              {data.recentPublications.length === 0 ? (
                <div className="flex items-center gap-2 px-4 pb-5 text-sm text-[#9ca3af]">
                  <AlertCircle size={15} /> Nothing published yet — your first post is one click away.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {data.recentPublications.map((post) => (
                      <tr key={post.id} className="hover:bg-[#F7F8FB]">
                        <td className="px-4 py-3 font-medium text-[#353535]">{post.title}</td>
                        <td className="px-4 py-3 text-[#6b6b6b]">
                          {post.Author ? `${post.Author.firstName} ${post.Author.lastName}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#9ca3af] text-xs">
                          {new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-[#037F44] font-medium text-xs">{post.views} views</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
