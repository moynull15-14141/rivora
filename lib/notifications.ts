import { db } from "./db";
import { sendPushNotification } from "./send-notification";

type NotifType = "like" | "comment" | "friend_request" | "friend_accept";

const NOTIF_TEXT: Record<NotifType, (actorName: string) => { title: string; body: string; sound: string }> = {
  like: (name) => ({ title: "New Like", body: `${name} liked your post`, sound: "/sounds/notification.wav" }),
  comment: (name) => ({ title: "New Comment", body: `${name} commented on your post`, sound: "/sounds/notification.wav" }),
  friend_request: (name) => ({ title: "Friend Request", body: `${name} sent you a friend request`, sound: "/sounds/notification.wav" }),
  friend_accept: (name) => ({ title: "New Friend", body: `${name} accepted your friend request`, sound: "/sounds/notification.wav" }),
};

const URL_MAP: Record<NotifType, string> = {
  like: "/notifications",
  comment: "/notifications",
  friend_request: "/notifications",
  friend_accept: "/notifications",
};

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
    const [, actor] = await Promise.all([
      db.notification.create({ data: { userId, actorId, type, postId } }),
      db.user.findUnique({ where: { id: actorId }, select: { name: true, image: true } }),
    ]);

    if (actor) {
      const { title, body, sound } = NOTIF_TEXT[type](actor.name);
      void sendPushNotification({
        userId,
        title,
        body,
        icon: actor.image ?? undefined,
        url: URL_MAP[type],
        sound,
        type,
      });
    }
  } catch {
    // Best-effort — notification failure must not break the main action
  }
}
