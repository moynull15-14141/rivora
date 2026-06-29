"use client";

import { useEffect } from "react";

export default function OnlinePing() {
  useEffect(() => {
    const ping = () => fetch("/api/ping", { method: "PATCH" }).catch(() => {});
    ping();
    const id = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
