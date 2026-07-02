import { db } from "./db";
import { sendPushNotification } from "./send-notification";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export type NotifType =
  | "like"
  | "comment"
  | "friend_request"
  | "friend_accept"
  | "mention_post"
  | "mention_comment";

const NOTIF_TEXT: Record<NotifType, (actorName: string) => { title: string; body: string; sound: string }> = {
  like:            (name) => ({ title: "New Like",           body: `${name} liked your post`,                     sound: "/sounds/notification.wav" }),
  comment:         (name) => ({ title: "New Comment",        body: `${name} commented on your post`,              sound: "/sounds/notification.wav" }),
  friend_request:  (name) => ({ title: "Friend Request",     body: `${name} sent you a friend request`,           sound: "/sounds/notification.wav" }),
  friend_accept:   (name) => ({ title: "New Friend",         body: `${name} accepted your friend request`,        sound: "/sounds/notification.wav" }),
  mention_post:    (name) => ({ title: "You were mentioned", body: `${name} mentioned you in a post`,             sound: "/sounds/notification.wav" }),
  mention_comment: (name) => ({ title: "You were mentioned", body: `${name} mentioned you in a comment`,         sound: "/sounds/notification.wav" }),
};

const URL_MAP: Record<NotifType, (postId?: string) => string> = {
  like:            (postId) => postId ? `/posts/${postId}` : "/notifications",
  comment:         (postId) => postId ? `/posts/${postId}` : "/notifications",
  friend_request:  ()       => "/notifications",
  friend_accept:   ()       => "/notifications",
  mention_post:    (postId) => postId ? `/posts/${postId}` : "/notifications",
  mention_comment: (postId) => postId ? `/posts/${postId}` : "/notifications",
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
      dbc.notification.create({ data: { userId, actorId, type, postId } }),
      db.user.findUnique({ where: { id: actorId }, select: { name: true, image: true } }),
    ]);

    if (actor) {
      const { title, body, sound } = NOTIF_TEXT[type](actor.name);
      void sendPushNotification({
        userId,
        title,
        body,
        icon: actor.image ?? undefined,
        url: URL_MAP[type](postId),
        sound,
        type,
      });
    }
  } catch {
    // Best-effort — notification failure must not break the main action
  }
}
