import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import Navbar from "@/components/navbar/Navbar";
import OnlinePing from "@/components/providers/OnlinePing";
import BottomNav from "@/components/layout/BottomNav";

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
  ]);

  return (
    <>
      <Navbar />
      <OnlinePing />
      {/* Extra bottom padding on mobile so content clears the bottom nav */}
      <div className="min-h-screen pb-16 lg:pb-0">{children}</div>
      <BottomNav
        username={user.username ?? user.id}
        pendingCount={pendingCount}
        unreadNotifs={unreadNotifs}
        unreadMessages={unreadMessages}
      />
    </>
  );
}
