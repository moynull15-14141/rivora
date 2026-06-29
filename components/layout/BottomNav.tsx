"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  username: string;
  pendingCount: number;
  unreadNotifs: number;
  unreadMessages: number;
}

const NAV = (username: string) => [
  {
    label: "Home",
    href: "/",
    exact: true,
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Friends",
    href: "/friends",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: `/${username}`,
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav({ username, pendingCount, unreadNotifs, unreadMessages }: Props) {
  const pathname = usePathname();

  const badges: Record<string, number> = {
    "/friends": pendingCount,
    "/messages": unreadMessages,
    "/notifications": unreadNotifs,
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-sm lg:hidden"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "color-mix(in srgb, var(--surface) 90%, transparent)",
      }}
    >
      <div className="flex items-center justify-around px-2 pb-safe">
        {NAV(username).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const badge = badges[item.href] ?? 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors"
              style={{ color: active ? "var(--color-primary)" : "var(--text-muted)" }}
            >
              <div className="relative">
                {item.icon(active)}
                {badge > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
