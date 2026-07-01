import { getAdminMessaging } from "./firebase-admin";
import { db } from "./db";

interface PushOptions {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  sound?: string;
  type?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export async function sendPushNotification({
  userId,
  title,
  body,
  icon = "",
  url = "/",
  sound = "",
  type = "",
}: PushOptions): Promise<void> {
  const messaging = getAdminMessaging();
  if (!messaging) return;

  try {
    const user = await dbc.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    });
    if (!user?.fcmTokens?.length) return;

    const messages = (user.fcmTokens as string[]).map((token: string) => ({
      token,
      notification: { title, body, ...(icon ? { imageUrl: icon } : {}) },
      webpush: {
        notification: { title, body, icon: icon || undefined, badge: "/icon-192.png" },
        fcm_options: { link: url },
      },
      data: { url, sound, type },
    }));

    const result = await messaging.sendEach(messages);

    // Remove tokens that are no longer valid
    const invalidTokens: string[] = [];
    result.responses.forEach((resp, i) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push((user.fcmTokens as string[])[i]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await dbc.user.update({
        where: { id: userId },
        data: {
          fcmTokens: {
            set: (user.fcmTokens as string[]).filter((t: string) => !invalidTokens.includes(t)),
          },
        },
      });
    }
  } catch {
    // Best-effort — push failure must not break the main action
  }
}
