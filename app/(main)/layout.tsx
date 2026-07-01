import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import Navbar from "@/components/navbar/Navbar";
import OnlinePing from "@/components/providers/OnlinePing";
import BottomNav from "@/components/layout/BottomNav";
import LeftSidebar from "@/components/layout/LeftSidebar";
import MessageBadgePoller from "@/components/messages/MessageBadgePoller";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/deactivated");

  const [pendingCount, unreadNotifs, unreadMessages] = await Promise.all([
    db.friend.count({ where: { friendId: user.id, status: "pending" } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    dbc.message.count({
      where: {
        read: false,
        senderId: { not: user.id },
        conversation: { participants: { some: { userId: user.id } } },
      },
    }),
  ]);

  return (
    <>
      <Navbar />
      <OnlinePing />
      <MessageBadgePoller />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <LeftSidebar
              user={{
                name: user.name,
                username: user.username ?? null,
                image: user.image ?? null,
              }}
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <BottomNav
        username={user.username ?? user.id}
        pendingCount={pendingCount}
        unreadNotifs={unreadNotifs}
        unreadMessages={unreadMessages}
      />
    </>
  );
}
