"use client";

import { useState } from "react";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import StoryViewer from "./StoryViewer";
import CreateStoryModal from "./CreateStoryModal";

export type StoryItem = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  backgroundColor: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
};

export type StoryGroup = {
  user: { id: string; name: string; username: string | null; image: string | null };
  stories: StoryItem[];
  hasUnseen: boolean;
};

interface Props {
  currentUser: { id: string; name: string; image: string | null };
  groups: StoryGroup[];
}

export default function StoryBar({ currentUser, groups }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [liveGroups, setLiveGroups] = useState<StoryGroup[]>(groups);

  const ownGroup = liveGroups.find((g) => g.user.id === currentUser.id);

  function openViewer(index: number) {
    setViewerGroupIndex(index);
    setViewerOpen(true);
  }

  function handleOwnClick() {
    const ownIdx = liveGroups.findIndex((g) => g.user.id === currentUser.id);
    if (ownIdx >= 0) {
      openViewer(ownIdx);
    } else {
      setCreateOpen(true);
    }
  }

  function handleStoryCreated(story: StoryItem) {
    setLiveGroups((prev) => {
      const existing = prev.findIndex((g) => g.user.id === currentUser.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], stories: [story, ...updated[existing].stories] };
        return updated;
      }
      return [
        {
          user: { id: currentUser.id, name: currentUser.name, username: null, image: currentUser.image },
          stories: [story],
          hasUnseen: false,
        },
        ...prev,
      ];
    });
    setCreateOpen(false);
  }

  return (
    <>
      <div
        className="rounded-2xl px-3 py-3 shadow-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* Add Story / Own Story */}
          <button
            onClick={handleOwnClick}
            className="flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className="relative">
              {ownGroup ? (
                <div className="rounded-full bg-gradient-to-tr from-teal-500 to-red-400 p-[2.5px]">
                  <div
                    className="rounded-full p-0.5"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-full">
                      {currentUser.image ? (
                        <Image src={currentUser.image} alt={currentUser.name} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2" style={{ borderColor: "var(--border)" }}>
                  {currentUser.image ? (
                    <Image src={currentUser.image} alt={currentUser.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              )}
              {!ownGroup && (
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
            </div>
            <span className="w-16 truncate text-center text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {ownGroup ? "Your Story" : "Add Story"}
            </span>
          </button>

          {/* Friends' story groups */}
          {liveGroups
            .filter((g) => g.user.id !== currentUser.id)
            .map((group, idx) => {
              const actualIdx = liveGroups.findIndex((g) => g.user.id === group.user.id);
              return (
                <button
                  key={group.user.id}
                  onClick={() => openViewer(actualIdx)}
                  className="flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
                >
                  <div
                    className={`rounded-full p-[2.5px] ${
                      group.hasUnseen
                        ? "bg-gradient-to-tr from-teal-500 to-red-400"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <div className="rounded-full p-0.5" style={{ background: "var(--surface)" }}>
                      <Avatar src={group.user.image} name={group.user.name} size="md" />
                    </div>
                  </div>
                  <span
                    className="w-16 truncate text-center text-[10px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {group.user.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {viewerOpen && liveGroups.length > 0 && (
        <StoryViewer
          groups={liveGroups}
          initialGroupIndex={viewerGroupIndex}
          currentUserId={currentUser.id}
          onClose={() => setViewerOpen(false)}
          onStorySeen={(storyId) => {
            setLiveGroups((prev) =>
              prev.map((g) => ({
                ...g,
                stories: g.stories.map((s) => (s.id === storyId ? { ...s, seen: true } : s)),
                hasUnseen: g.stories.some((s) => s.id !== storyId && !s.seen),
              }))
            );
          }}
        />
      )}

      {createOpen && (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </>
  );
}
