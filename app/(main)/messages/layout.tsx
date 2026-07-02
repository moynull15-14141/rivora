import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import MessagesShell from "@/components/chat/MessagesShell";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <MessagesShell
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image ?? null,
      }}
    >
      {children}
    </MessagesShell>
  );
}
