import MessageBadgePoller from "@/components/messages/MessageBadgePoller";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MessageBadgePoller />
      {children}
    </>
  );
}
