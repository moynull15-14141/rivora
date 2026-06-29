import { db } from "./db";

type NotifType = "like" | "comment" | "friend_request" | "friend_accept";

export async function createNotification({
  userId,
  actorId,
  type,
  postId,
}: {
  userId: string;
  actorId: string;
  type: NotifType;
  postId?: string;
}): Promise<void> {
  if (userId === actorId) return;
  try {
    await db.notification.create({
      data: { userId, actorId, type, postId },
    });
  } catch {
    // Best-effort — notification failure must not break the main action
  }
}
