"use client";

import { usePathname } from "next/navigation";
import ConversationSidebar from "./ConversationSidebar";

type CurrentUser = { id: string; name: string; image: string | null };

export default function MessagesShell({
  currentUser,
  children,
}: {
  currentUser: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inChat = pathname.startsWith("/messages/") && pathname !== "/messages/";

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Sidebar: full-width on mobile when at /messages; fixed width on desktop always */}
      <div
        className={`relative flex-col border-r ${inChat ? "hidden sm:flex sm:w-80 lg:w-96" : "flex w-full sm:w-80 lg:w-96"}`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", flexShrink: 0 }}
      >
        <ConversationSidebar currentUser={currentUser} />
      </div>

      {/* Main content: hidden on mobile when at /messages; flex otherwise */}
      <div
        className={`min-w-0 flex-1 flex-col ${inChat ? "flex" : "hidden sm:flex"}`}
        style={{ background: "var(--background)" }}
      >
        {children}
      </div>
    </div>
  );
}
