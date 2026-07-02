"use client";

import { useEffect, useRef, useState } from "react";
import { getFirebaseMessaging } from "@/lib/firebase-client";
import { getToken, onMessage } from "firebase/messaging";

interface Toast {
  id: string;
  title: string;
  body: string;
  icon?: string;
  url: string;
}

function getPrefs() {
  if (typeof window === "undefined") return { messages: true, likes: true, comments: true, friends: true };
  return {
    messages: localStorage.getItem("notif_messages") !== "false",
    likes: localStorage.getItem("notif_likes") !== "false",
    comments: localStorage.getItem("notif_comments") !== "false",
    friends: localStorage.getItem("notif_friends") !== "false",
  };
}

function playSound(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.6;
    void audio.play().catch(() => {});
  } catch {}
}

export default function NotificationProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fcmTokenRef = useRef<string | null>(null);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function addToast(toast: Omit<Toast, "id">) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    setTimeout(() => dismiss(id), 5000);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;

    async function init() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const swReg = await navigator.serviceWorker.register(
          "/api/firebase-messaging-sw",
          { scope: "/" }
        );

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (token && token !== fcmTokenRef.current) {
          fcmTokenRef.current = token;
          await fetch("/api/fcm-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }

        onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? "Rivora";
          const body = payload.notification?.body ?? "";
          const icon = payload.notification?.icon;
          const url = (payload.data?.url as string) || "/";
          const sound = (payload.data?.sound as string) || "";
          const type = (payload.data?.type as string) || "";

          const prefs = getPrefs();
          if (type === "message" && !prefs.messages) return;
          if (type === "like" && !prefs.likes) return;
          if (type === "comment" && !prefs.comments) return;
          if ((type === "friend_request" || type === "friend_accept") && !prefs.friends) return;

          addToast({ title, body, icon, url });

          if (sound) playSound(sound);
        });
      } catch {
        // Firebase not configured, permission denied, or not supported
      }
    }

    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-3 z-[200] flex flex-col gap-2 sm:bottom-4 sm:right-4">
      {toasts.map((toast) => (
        <a
          key={toast.id}
          href={toast.url}
          onClick={() => dismiss(toast.id)}
          className="flex w-72 cursor-pointer items-start gap-3 rounded-xl p-3 shadow-lg transition-all"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {toast.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toast.icon}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {toast.title}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
              {toast.body}
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); dismiss(toast.id); }}
            className="shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </a>
      ))}
    </div>
  );
}
