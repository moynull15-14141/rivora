import { PostCardSkeleton, ProfileHeaderSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4">
        <ProfileHeaderSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
