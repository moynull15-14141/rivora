"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { StoryItem } from "./StoryBar";

const PRESET_COLORS = [
  "#0d9488", // teal (brand)
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#10b981", // emerald
  "#1f2937", // dark
];

const MAX_VIDEO_DURATION = 15; // seconds — client-side validation

interface Props {
  onClose: () => void;
  onCreated: (story: StoryItem) => void;
}

type Tab = "media" | "text";

export default function CreateStoryModal({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<Tab>("media");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [bgColor, setBgColor] = useState(PRESET_COLORS[0]);
  const [textContent, setTextContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;

    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Only image or video files are supported.");
      return;
    }

    if (isVideo) {
      // Client-side duration check via a temporary video element
      const url = URL.createObjectURL(f);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration > MAX_VIDEO_DURATION) {
          setError(`Video must be ${MAX_VIDEO_DURATION} seconds or shorter.`);
          return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setMediaType("video");
      };
      video.src = url;
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMediaType("image");
  }

  async function handlePost() {
    setError("");

    if (tab === "text") {
      if (!textContent.trim()) { setError("Please enter some text."); return; }
      setUploading(true);
      try {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaUrl: "",
            mediaType: "image",
            caption: textContent.trim(),
            backgroundColor: bgColor,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "Failed");
        onCreated({ ...json.data, seen: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!file) { setError("Please select a photo or video."); return; }

    setUploading(true);
    try {
      // 1. Upload media
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/stories/upload", { method: "POST", body: form });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) throw new Error(uploadJson.error ?? "Upload failed");

      const { url, mediaType: type } = uploadJson.data;

      // 2. Create story
      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl: url, mediaType: type, caption: caption.trim() || undefined }),
      });
      const storyJson = await storyRes.json();
      if (!storyRes.ok || !storyJson.success) throw new Error(storyJson.error ?? "Failed to create story");

      onCreated({ ...storyJson.data, seen: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-modal-in w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-heading text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Create Story
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {(["media", "text"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t ? "border-b-2 border-primary text-primary" : ""
              }`}
              style={tab !== t ? { color: "var(--text-muted)" } : undefined}
            >
              {t === "media" ? "📷 Photo / Video" : "🎨 Text Only"}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "media" ? (
            <>
              {/* Media picker */}
              {!preview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm">Tap to select photo or video</span>
                  <span className="text-xs opacity-60">Max 15s for video</span>
                </button>
              ) : (
                <div className="relative h-48 w-full overflow-hidden rounded-xl">
                  {mediaType === "image" ? (
                    <Image src={preview} alt="Preview" fill sizes="400px" className="object-cover" />
                  ) : (
                    <video src={preview} className="h-full w-full object-cover" muted playsInline autoPlay loop />
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleFile}
              />

              {/* Caption */}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption…"
                maxLength={200}
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-hover)",
                  color: "var(--text-primary)",
                }}
              />
            </>
          ) : (
            <>
              {/* Text story preview */}
              <div
                className="flex h-48 w-full items-center justify-center rounded-xl p-4"
                style={{ backgroundColor: bgColor }}
              >
                <p className="text-center text-xl font-bold text-white leading-snug">
                  {textContent || <span className="opacity-50">Your text here…</span>}
                </p>
              </div>

              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write something…"
                maxLength={200}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-hover)",
                  color: "var(--text-primary)",
                }}
              />

              {/* Color picker */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Background:</span>
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: bgColor === c ? "2px solid var(--color-primary)" : undefined,
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? "Posting…" : "Post Story"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
