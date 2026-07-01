"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Polls unread message + notification counts globally; refreshes server data when either changes.
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

        const messagesChanged =
          lastMessages.current !== null && lastMessages.current !== unreadMessages;
        const notifsChanged =
          lastNotifs.current !== null && lastNotifs.current !== unreadNotifs;

        if (messagesChanged || notifsChanged) {
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
