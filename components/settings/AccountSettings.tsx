"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  requireType,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  requireType?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const ready = requireType ? typed === requireType : true;

  async function handle() {
    if (!ready) return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h3 className="font-heading text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>

        {requireType && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              Type{" "}
              <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                {requireType}
              </span>{" "}
              to confirm
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireType}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-[var(--text-muted)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-hover)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={!ready || loading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 ${confirmClass}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountSettings() {
  const router = useRouter();
  const [modal, setModal] = useState<"deactivate" | "delete" | null>(null);

  async function deactivate() {
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate" }),
    });
    await signOut();
    router.push("/deactivated");
  }

  async function deleteAccount() {
    await fetch("/api/account", { method: "DELETE" });
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div
        className="rounded-2xl p-6 shadow-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-heading text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Account
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your account status.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {/* Deactivate */}
          <div
            className="flex items-start justify-between gap-4 rounded-xl border p-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Deactivate Account
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                Your profile and posts will be hidden. You can reactivate anytime by logging back in.
              </p>
            </div>
            <button
              onClick={() => setModal("deactivate")}
              className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
            >
              Deactivate
            </button>
          </div>

          {/* Delete */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-100 p-4 dark:border-red-900/40">
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                Delete Account
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                Permanently deletes your account, posts, messages, and all data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setModal("delete")}
              className="shrink-0 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {modal === "deactivate" && (
        <ConfirmModal
          title="Deactivate your account?"
          description="Your profile will be hidden from others. You can come back anytime by logging in and clicking Reactivate."
          confirmLabel="Deactivate"
          confirmClass="bg-amber-500"
          onConfirm={deactivate}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "delete" && (
        <ConfirmModal
          title="Delete your account?"
          description="This will permanently delete your profile, posts, comments, and all data. There is no way to recover this account."
          confirmLabel="Delete Forever"
          confirmClass="bg-red-500"
          requireType="DELETE"
          onConfirm={deleteAccount}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
