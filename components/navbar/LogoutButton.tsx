"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        title="Logout"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-400 sm:h-auto sm:w-auto sm:rounded-lg sm:border sm:border-gray-200 sm:px-3 sm:py-1.5 sm:text-xs sm:font-medium sm:text-gray-600 sm:hover:border-accent sm:hover:bg-transparent sm:hover:text-accent"
      >
        <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Logout</span>
      </button>

      {showConfirm && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowConfirm(false)}
        >
          <div
            className="animate-modal-in w-full max-w-sm rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h2 className="mb-1 text-center font-heading text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Log out?
            </h2>
            <p className="mb-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Are you sure you want to log out of Rivora?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Logging out…" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
