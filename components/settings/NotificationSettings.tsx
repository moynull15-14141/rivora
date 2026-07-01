"use client";

import { useEffect, useState } from "react";

const PREFS = [
  { key: "notif_messages", label: "Message Notification", desc: "নতুন message এলে notify করবে" },
  { key: "notif_likes", label: "Like Notification", desc: "কেউ post like করলে notify করবে" },
  { key: "notif_comments", label: "Comment Notification", desc: "কেউ comment করলে notify করবে" },
  { key: "notif_friends", label: "Friend Request Notification", desc: "Friend request ও accept হলে notify করবে" },
] as const;

export default function NotificationSettings() {
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("Notification" in window)) { setSupported(false); return; }
    const loaded: Record<string, boolean> = {};
    for (const pref of PREFS) {
      loaded[pref.key] = localStorage.getItem(pref.key) !== "false";
    }
    setValues(loaded);
  }, []);

  function toggle(key: string) {
    const next = !values[key];
    setValues((prev) => ({ ...prev, [key]: next }));
    localStorage.setItem(key, String(next));
  }

  if (!supported) {
    return (
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="mb-1 font-heading text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Notifications
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          এই browser-এ push notification সাপোর্ট নেই।
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="mb-4 font-heading text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        Notifications
      </h2>
      <div className="flex flex-col gap-4">
        {PREFS.map((pref) => (
          <div key={pref.key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {pref.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {pref.desc}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={values[pref.key] ?? true}
              onClick={() => toggle(pref.key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                (values[pref.key] ?? true) ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  (values[pref.key] ?? true) ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
