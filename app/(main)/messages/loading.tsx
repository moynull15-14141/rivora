export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
      <div className="mt-4 h-5 w-32 animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}
