import { PostCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_200px]">
        {/* Left sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 h-40 animate-pulse rounded-xl bg-[var(--surface)]" />
        </aside>

        {/* Feed */}
        <div className="flex flex-col gap-4">
          {/* Create post skeleton */}
          <div className="flex items-center gap-3 rounded-2xl p-4 shadow-sm" style={{ background: "var(--surface)" }}>
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--surface-hover)]" />
            <div className="h-10 flex-1 animate-pulse rounded-full bg-[var(--surface-hover)]" />
          </div>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 h-40 animate-pulse rounded-xl bg-[var(--surface)]" />
        </aside>
      </div>
    </div>
  );
}
