import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import NotificationList from "@/components/notifications/NotificationList";

export const metadata = { title: "Notifications — Rivora" };

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: currentUser.id },
    select: {
      id: true,
      type: true,
      postId: true,
      read: true,
      createdAt: true,
      actor: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-gray-900">Notifications</h1>
        {notifications.length > 0 && (
          <span className="text-xs text-gray-400">
            {notifications.filter((n) => !n.read).length > 0
              ? `${notifications.filter((n) => !n.read).length} unread`
              : "All caught up"}
          </span>
        )}
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
