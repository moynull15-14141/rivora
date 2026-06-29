"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeactivatedPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function reactivate() {
    setLoading(true);
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reactivate" }),
    });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Account Deactivated</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account is currently deactivated. Reactivate to access Rivora again.
        </p>
        <button
          onClick={reactivate}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Reactivating…" : "Reactivate My Account"}
        </button>
      </div>
    </div>
  );
}
