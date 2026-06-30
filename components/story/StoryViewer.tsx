"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { StoryGroup, StoryItem } from "./StoryBar";

const STORY_DURATION = 5000; // ms for images

interface Props {
  groups: StoryGroup[];
  initialGroupIndex: number;
  currentUserId: string;
  onClose: () => void;
  onStorySeen: (storyId: string) => void;
}

export default function StoryViewer({ groups, initialGroupIndex, currentUserId, onClose, onStorySeen }: Props) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(STORY_DURATION);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const group = groups[groupIdx];
  const story: StoryItem | undefined = group?.stories[storyIdx];
  const isOwn = group?.user.id === currentUserId;

  const goNextStory = useCallback(() => {
    const currentGroup = groups[groupIdx];
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
      progressRef.current = 0;
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
      setProgress(0);
      progressRef.current = 0;
    } else {
      onClose();
    }
  }, [groupIdx, storyIdx, groups, onClose]);

  const goPrevStory = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
      progressRef.current = 0;
    } else if (groupIdx > 0) {
      setGroupIdx((i) => i - 1);
      const prevGroup = groups[groupIdx - 1];
      setStoryIdx(prevGroup.stories.length - 1);
      setProgress(0);
      progressRef.current = 0;
    }
  }, [groupIdx, storyIdx, groups]);

  // Track view
  useEffect(() => {
    if (!story || isOwn) return;
    fetch(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => {});
    onStorySeen(story.id);
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress timer
  useEffect(() => {
    if (!story) return;
    if (paused) return;

    const duration = story.mediaType === "video" ? videoDuration : STORY_DURATION;
    const TICK = 50;

    timerRef.current = setInterval(() => {
      progressRef.current += (TICK / duration) * 100;
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        clearInterval(timerRef.current!);
        goNextStory();
      }
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [story?.id, paused, videoDuration, goNextStory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset progress when story changes
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    setVideoDuration(STORY_DURATION);
  }, [story?.id]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNextStory();
      if (e.key === "ArrowLeft") goPrevStory();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNextStory, goPrevStory]);

  if (!group || !story) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Story content */}
      <div className="relative h-full w-full max-w-sm">
        {story.mediaType === "image" ? (
          story.mediaUrl ? (
            <Image
              src={story.mediaUrl}
              alt="Story"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: story.backgroundColor ?? "#0d9488" }}
            />
          )
        ) : (
          <video
            ref={videoRef}
            src={story.mediaUrl}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted={muted}
            onLoadedMetadata={(e) => {
              const dur = (e.target as HTMLVideoElement).duration * 1000;
              setVideoDuration(Math.min(dur, 15000));
            }}
            onEnded={goNextStory}
          />
        )}

        {/* Text-only overlay */}
        {!story.mediaUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center p-8"
            style={{ backgroundColor: story.backgroundColor ?? "#0d9488" }}
          >
            <p className="text-center text-2xl font-bold text-white leading-snug">{story.caption}</p>
          </div>
        )}

        {/* Dark gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Progress bars */}
        <div className="absolute inset-x-3 top-3 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/40">
              <div
                className="h-full bg-white transition-none"
                style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-0 top-6 flex items-center gap-3 px-3 pt-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white">
            {group.user.image ? (
              <Image src={group.user.image} alt={group.user.name} width={36} height={36} className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-white">
                {group.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{group.user.name}</p>
            <p className="text-[10px] text-white/70">
              {new Date(story.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Mute for video */}
          {story.mediaType === "video" && (
            <button
              onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
            >
              {muted ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 015.93 12a5 5 0 002.534 4.536M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          )}

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Caption + viewer count */}
        <div className="absolute inset-x-0 bottom-6 px-4 pb-2">
          {story.caption && story.mediaUrl && (
            <p className="mb-2 text-sm text-white drop-shadow">{story.caption}</p>
          )}
          {isOwn && (
            <div className="flex items-center gap-1 text-white/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-xs">{story.viewCount} views</span>
            </div>
          )}
        </div>

        {/* Tap zones for prev/next */}
        <button
          className="absolute inset-y-0 left-0 w-1/3"
          onClick={(e) => { e.stopPropagation(); goPrevStory(); }}
          aria-label="Previous story"
        />
        <button
          className="absolute inset-y-0 right-0 w-1/3"
          onClick={(e) => { e.stopPropagation(); goNextStory(); }}
          aria-label="Next story"
        />
      </div>

      {/* Side arrows on desktop */}
      {groupIdx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setGroupIdx((i) => i - 1); setStoryIdx(0); setProgress(0); progressRef.current = 0; }}
          className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 sm:flex"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {groupIdx < groups.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setGroupIdx((i) => i + 1); setStoryIdx(0); setProgress(0); progressRef.current = 0; }}
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 sm:flex"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
