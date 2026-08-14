"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import PostEditor from "@/components/blog/PostEditor";

export default function EditPostPage() {
  const params = useParams();
  const id = Number(params?.id);

  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <PostEditor postId={id} />
    </ProtectedRoute>
  );
}
