"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PostEditor from "@/components/blog/PostEditor";

export default function NewPostPage() {
  return (
    <ProtectedRoute allowedRoles={["superadmin", "admin", "supportagent", "verificationofficer"]}>
      <PostEditor />
    </ProtectedRoute>
  );
}
