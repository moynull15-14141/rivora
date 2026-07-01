"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function playSound(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {}
}

// Polls unread message + notification counts globally; refreshes and plays sound when either increases.
export default function MessageBadgePoller() {
  const router = useRouter();
  const lastMessages = useRef<number | null>(null);
  const lastNotifs = useRef<number | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/unread-count");
        if (!res.ok) return;
        const { unreadMessages, unreadNotifs } = await res.json();

        const newMessages =
          lastMessages.current !== null && unreadMessages > lastMessages.current;
        const newNotifs =
          lastNotifs.current !== null && unreadNotifs > lastNotifs.current;

        if (newMessages || newNotifs) {
          router.refresh();
          if (newMessages) playSound("/sounds/msgtune.wav");
          if (newNotifs) playSound("/sounds/notification.wav");
        } else if (
          lastMessages.current !== null &&
          (lastMessages.current !== unreadMessages || lastNotifs.current !== unreadNotifs)
        ) {
          // Count decreased (messages read) — refresh silently
          router.refresh();
        }

        lastMessages.current = unreadMessages;
        lastNotifs.current = unreadNotifs;
      } catch {
        // ignore network errors
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
