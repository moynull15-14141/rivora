import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import Avatar from "@/components/ui/Avatar";
import LogoutButton from "./LogoutButton";
import SearchButton from "./SearchButton";
import MobileMenuDrawer from "./MobileMenuDrawer";

export default async function Navbar() {
  const user = await getCurrentUser();

  const [pendingCount, unreadCount, unreadMessages] = user
    ? await Promise.all([
        db.friend.count({ where: { friendId: user.id, status: "pending" } }),
        db.notification.count({ where: { userId: user.id, read: false } }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).message
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (db as any).message.count({
              where: {
                read: false,
                senderId: { not: user.id },
                conversation: { participants: { some: { userId: user.id } } },
              },
            })
          : Promise.resolve(0),
      ])
    : [0, 0, 0];

  return (
    <nav
      className="sticky top-0 z-50 h-14 border-b backdrop-blur-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
      }}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-primary dark:text-white">
          Rivora
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <SearchButton />

              {/* Friends — hidden on mobile (covered by bottom nav) */}
              <Link
                href="/friends"
                className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] hover:text-primary"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Friends"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>

              {/* Messages — hidden on mobile */}
              <Link
                href="/messages"
                className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] hover:text-primary"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Messages"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications — hidden on mobile */}
              <Link
                href="/notifications"
                className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] hover:text-primary"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Notifications"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile link */}
              <Link
                href={`/${user.username ?? user.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <Avatar src={user.image} name={user.name} size="sm" />
                <span
                  className="hidden text-sm font-medium sm:block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user.name}
                </span>
              </Link>

              {/* Logout — desktop only */}
              <div className="hidden sm:block">
                <LogoutButton />
              </div>

              {/* Hamburger menu — mobile only */}
              <MobileMenuDrawer
                user={{
                  name: user.name,
                  username: user.username ?? null,
                  image: user.image ?? null,
                }}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors hover:text-primary"
                style={{ color: "var(--text-secondary)" }}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="ml-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
