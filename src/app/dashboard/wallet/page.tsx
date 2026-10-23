import { redirect } from "next/navigation";

// The Finance module was redesigned and moved to /dashboard/finance/*.
// This route is kept (not deleted) so existing bookmarks/links still work.
export default function Page() {
  redirect("/dashboard/finance/overview");
}
