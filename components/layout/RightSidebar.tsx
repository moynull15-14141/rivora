import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import AddFriendButton from "./AddFriendButton";

type Suggestion = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
};

export default function RightSidebar({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div
      className="sticky top-20 rounded-2xl p-4 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p
        className="mb-3 text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        People you may know
      </p>

      <ul className="flex flex-col gap-3">
        {suggestions.map((user) => {
          const href = `/${user.username ?? user.id}`;
          return (
            <li key={user.id} className="flex items-center gap-2.5">
              <Link href={href} className="shrink-0">
                <Avatar src={user.image} name={user.name} size="sm" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="block truncate text-sm font-semibold hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.name}
                </Link>
                {user.username && (
                  <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    @{user.username}
                  </p>
                )}
              </div>

              <AddFriendButton userId={user.id} />
            </li>
          );
        })}
      </ul>

      <Link
        href="/search"
        className="mt-4 block text-center text-xs font-medium text-primary hover:underline"
      >
        Find more people →
      </Link>
    </div>
  );
}
