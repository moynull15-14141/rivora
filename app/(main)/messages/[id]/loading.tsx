export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-28 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-3 w-16 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Messages area — empty while loading */}
      <div className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex justify-start">
            <div className="h-10 w-48 animate-pulse rounded-2xl rounded-bl-sm bg-white shadow-sm" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-36 animate-pulse rounded-2xl rounded-br-sm bg-primary/20" />
          </div>
          <div className="flex justify-start">
            <div className="h-10 w-56 animate-pulse rounded-2xl rounded-bl-sm bg-white shadow-sm" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-44 animate-pulse rounded-2xl rounded-br-sm bg-primary/20" />
          </div>
          <div className="flex justify-start">
            <div className="h-10 w-40 animate-pulse rounded-2xl rounded-bl-sm bg-white shadow-sm" />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <div className="h-10 flex-1 animate-pulse rounded-full bg-gray-100" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
