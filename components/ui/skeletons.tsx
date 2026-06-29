function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-hover)] ${className}`} />;
}

export function PostCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <Bone className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-5 pb-3">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-4 w-3/5" />
      </div>
      <div className="flex gap-2 border-t px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <Bone className="h-8 w-16" />
        <Bone className="h-8 w-16" />
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Bone className="h-12 w-12 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-52" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <Bone className="h-48 w-full rounded-none sm:h-56" />
      <div className="px-5 pb-5 sm:px-6">
        <div className="flex items-end justify-between">
          <Bone className="-mt-10 h-20 w-20 rounded-full ring-4 ring-[var(--surface)]" />
          <Bone className="mt-3 h-9 w-28" />
        </div>
        <Bone className="mt-4 h-6 w-40" />
        <Bone className="mt-2 h-4 w-24" />
        <div className="mt-4 flex gap-6 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <Bone className="h-5 w-16" />
          <Bone className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}
