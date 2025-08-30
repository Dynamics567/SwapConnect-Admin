"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react"; // Import back arrow icon
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

export default function EditStorePage() {
  const router = useRouter();
  const token = useAuthToken();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
const params = useParams();
  const storeId = params.storeId;
  // Fetch store data by ID
  useEffect(() => {
    if (!token) return;
    const fetchStore = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/store/${storeId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        // console.log("store Id:", id);
        console.log("API raw response:", data);

        if (!res.ok) {
          throw new Error(data.message || "Failed to load store data");
        }

        setName(data.data.name);
        setAddress(data.data.address);
        setContact(data.data.contact);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchStore();
  }, [token, storeId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !address || !contact) {
      alert("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/store/${storeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, address, contact }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update store.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push("/dashboard/store");
      }, 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#037F44] font-semibold">
        Loading store details...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-4">
      {/* Back Button */}
      <div className="w-full max-w-md mt-10 mb-4 flex justify-start">
        <button
          onClick={() => router.push("/dashboard/store")}
          className="flex items-center text-[#037F44] hover:text-[#025e2e] transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Stores
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-[#037F44]">
          Edit Store Details
        </h2>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1 text-[#505050]">
              Store Name
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Address</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Contact</label>
            <input
              type="tel"
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Store"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}

        {success && (
          <div className="fixed top-5 right-5 z-50 bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded shadow text-sm animate-fade">
            ✅ Store updated successfully!
          </div>
        )}
      </div>
    </div>
  );
}
