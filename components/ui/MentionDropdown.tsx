"use client";

import Avatar from "@/components/ui/Avatar";
import type { MentionUser } from "@/hooks/useMentionInput";

interface MentionDropdownProps {
  users: MentionUser[];
  loading: boolean;
  query: string;
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
}

export default function MentionDropdown({
  users,
  loading,
  query,
  selectedIndex,
  onSelect,
}: MentionDropdownProps) {
  // Don't render if nothing to show
  if (!loading && users.length === 0 && query.length === 0) return null;
  if (!loading && users.length === 0 && query.length > 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-xl shadow-lg"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      // Prevent the textarea blur from firing before the click registers
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading ? (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Searching…
          </span>
        </div>
      ) : (
        <ul className="max-h-52 overflow-y-auto py-1">
          {users.map((user, i) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelect(user)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === selectedIndex
                    ? "bg-primary/10"
                    : "hover:bg-[var(--surface-hover)]"
                }`}
              >
                <Avatar src={user.image} name={user.name} size="xs" />
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    @{user.username}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
