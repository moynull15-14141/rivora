import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import RequestCard from "@/components/friends/RequestCard";
import FriendCard from "@/components/friends/FriendCard";

export const metadata = { title: "Friends — Rivora" };

export default async function FriendsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [requests, friends] = await Promise.all([
    db.friend.findMany({
      where: { friendId: currentUser.id, status: "pending" },
      select: {
        id: true,
        user: {
          select: { id: true, name: true, username: true, image: true, bio: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.friend.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: currentUser.id }, { friendId: currentUser.id }],
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: { id: true, name: true, username: true, image: true, bio: true, lastSeen: true },
        },
        friend: {
          select: { id: true, name: true, username: true, image: true, bio: true, lastSeen: true },
        },
      },
      orderBy: { acceptedAt: "desc" },
    }),
  ]);

  const friendList = friends.map((f) => ({
    id: f.id,
    friend: f.userId === currentUser.id ? f.friend : f.user,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Friend Requests */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Friend Requests
          </h2>
          {requests.length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              {requests.length}
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No pending friend requests
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <RequestCard key={r.id} friendship={r} />
            ))}
          </div>
        )}
      </section>

      {/* Friends List */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Friends
          </h2>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {friendList.length}
          </span>
        </div>

        {friendList.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You haven&apos;t added any friends yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {friendList.map((f) => (
              <FriendCard key={f.id} friendship={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
