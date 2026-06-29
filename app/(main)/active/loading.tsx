function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-hover)] ${className}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <Bone className="h-8 w-44" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>
      <div
        className="overflow-hidden rounded-2xl shadow-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t" : ""}`}
            style={{ borderColor: "var(--border)" }}
          >
            <Bone className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Bone className="h-4 w-36" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
