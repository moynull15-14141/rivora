"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrivacySettings({
  userId,
  initialIsPrivate,
}: {
  userId: string;
  initialIsPrivate: boolean;
}) {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function toggle() {
    setSaving(true);
    const newValue = !isPrivate;
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrivate: newValue }),
    });
    if (res.ok) {
      setIsPrivate(newValue);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="font-heading text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        Privacy
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Control who can see your profile and posts.
      </p>

      <div className="mt-4">
        <div
          className="flex items-center justify-between gap-4 rounded-xl border p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Private Account
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {isPrivate
                  ? "Only your friends can see your posts and profile details."
                  : "Anyone on Rivora can see your posts and profile."}
              </p>
            </div>
          </div>

          <button
            onClick={toggle}
            disabled={saving}
            role="switch"
            aria-checked={isPrivate}
            aria-label="Toggle private account"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:opacity-60 ${
              isPrivate ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPrivate ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {isPrivate && (
          <p className="mt-3 flex items-start gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Existing friends can still see your posts. New visitors will see a private profile page.
          </p>
        )}
      </div>
    </div>
  );
}
