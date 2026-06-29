import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import SearchBar from "@/components/search/SearchBar";

export const metadata = { title: "Search — Rivora" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { q = "" } = await searchParams;
  const query = q.trim();

  const users =
    query.length > 0
      ? await db.user.findMany({
          where: {
            id: { not: currentUser.id },
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
          take: 20,
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 font-heading text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Search
      </h1>

      <div className="mb-6">
        <SearchBar initialQuery={query} />
      </div>

      {/* Empty state — no query */}
      {query.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center shadow-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--surface-hover)" }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Search for people
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Find friends by name or username
          </p>
        </div>
      )}

      {/* Empty state — no results */}
      {query.length > 0 && users.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center shadow-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Try a different name or username
          </p>
        </div>
      )}

      {/* Results */}
      {users.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {users.length} result{users.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/${user.username ?? user.id}`}
              className="flex items-center gap-3 rounded-2xl p-4 shadow-sm transition-colors hover:bg-[var(--surface-hover)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {/* Avatar */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-primary">
                    {user.name[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {user.name}
                </p>
                {user.username && (
                  <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                    @{user.username}
                  </p>
                )}
                {user.bio && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <svg
                className="ml-auto h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: "var(--text-muted)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
