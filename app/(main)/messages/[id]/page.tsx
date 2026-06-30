import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import ChatWindow from "@/components/chat/ChatWindow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { id } = await params;

  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!participant) notFound();

  const conversation = await dbc.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        where: { userId: { not: currentUser.id } },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true, lastSeen: true },
          },
        },
      },
    },
  });
  if (!conversation) notFound();

  const otherUser = conversation.participants[0]?.user;
  if (!otherUser) notFound();

  const [rawMessages] = await Promise.all([
    dbc.message.findMany({
      where: { conversationId: id },
      select: {
        id: true,
        content: true,
        senderId: true,
        read: true,
        createdAt: true,
        sender: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    dbc.message.updateMany({
      where: { conversationId: id, senderId: { not: currentUser.id }, read: false },
      data: { read: true },
    }),
  ]);
  // Reverse so initial messages are oldest-first
  const messages = rawMessages.reverse();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedMessages = messages.map((m: any) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ChatWindow
      conversationId={id}
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image ?? null,
      }}
      otherUser={otherUser}
      initialMessages={mappedMessages}
    />
  );
}
