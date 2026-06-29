import { ConversationSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-4 h-7 w-28 animate-pulse rounded-lg bg-gray-200" />
      <div className="overflow-hidden rounded-2xl shadow-sm divide-y" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <ConversationSkeleton />
        <ConversationSkeleton />
        <ConversationSkeleton />
        <ConversationSkeleton />
        <ConversationSkeleton />
      </div>
    </div>
  );
}
