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

  // Check membership
  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!participant) notFound();
  // If user left a group, redirect away
  if (participant.leftAt) redirect("/messages");

  const conversation = await dbc.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true, lastSeen: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!conversation) notFound();

  const [rawMessages] = await Promise.all([
    dbc.message.findMany({
      where: { conversationId: id },
      select: {
        id: true,
        content: true,
        senderId: true,
        read: true,
        editedAt: true,
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

  const messages = rawMessages.reverse();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedMessages = messages.map((m: any) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
  }));

  const me = { id: currentUser.id, name: currentUser.name, image: currentUser.image ?? null };

  if (conversation.isGroup) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedParticipants = conversation.participants.map((p: any) => ({
      id: p.userId,
      name: p.user.name,
      username: p.user.username,
      image: p.user.image,
      isAdmin: p.isAdmin,
    }));

    return (
      <ChatWindow
        conversationId={id}
        currentUser={me}
        isGroup
        groupName={conversation.name ?? "Group"}
        groupAvatar={conversation.avatar ?? null}
        participants={mappedParticipants}
        isAdmin={participant.isAdmin}
        initialMessages={mappedMessages}
      />
    );
  } else {
    // DM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otherParticipant = conversation.participants.find((p: any) => p.userId !== currentUser.id);
    if (!otherParticipant) notFound();

    return (
      <ChatWindow
        conversationId={id}
        currentUser={me}
        otherUser={{
          id: otherParticipant.userId,
          name: otherParticipant.user.name,
          username: otherParticipant.user.username,
          image: otherParticipant.user.image,
          lastSeen: otherParticipant.user.lastSeen,
        }}
        initialMessages={mappedMessages}
      />
    );
  }
}
