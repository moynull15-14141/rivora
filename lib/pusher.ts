import Pusher from "pusher";

const isConfigured =
  !!process.env.PUSHER_APP_ID &&
  !!process.env.PUSHER_SECRET &&
  process.env.PUSHER_APP_ID !== "your_app_id" &&
  process.env.PUSHER_SECRET !== "your_secret";

export const pusher = isConfigured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export function triggerPusher(channel: string, event: string, data: unknown): Promise<void> {
  if (!pusher) return Promise.resolve();
  return pusher.trigger(channel, event, data as Record<string, unknown>).then(() => {});
}
