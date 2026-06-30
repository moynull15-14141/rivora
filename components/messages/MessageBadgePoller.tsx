"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function MessageBadgePoller() {
  const router = useRouter();
  const lastCount = useRef<number | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/unread-count");
        if (!res.ok) return;
        const { unreadMessages } = await res.json();

        if (lastCount.current !== null && lastCount.current !== unreadMessages) {
          router.refresh();
        }
        lastCount.current = unreadMessages;
      } catch {
        // ignore network errors
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
