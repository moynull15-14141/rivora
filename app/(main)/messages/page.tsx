import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Messages — Rivora" };

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--surface-hover)" }}
      >
        <svg
          className="h-8 w-8"
          style={{ color: "var(--text-muted)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <p className="mt-4 font-semibold" style={{ color: "var(--text-primary)" }}>
        Your Messages
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Select a conversation from the sidebar to start chatting
      </p>
    </div>
  );
}
