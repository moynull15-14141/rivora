"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMentionInput } from "@/hooks/useMentionInput";
import MentionDropdown from "@/components/ui/MentionDropdown";

const MAX_IMAGES = 4;

export default function CreatePost({
  userName,
  userImage,
}: {
  userName: string;
  userImage: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibility, setVisibility] = useState<"public" | "friends" | "only_me">("public");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    value: content,
    setValue: setContent,
    mentionQuery,
    mentionUsers,
    mentionLoading,
    selectedIndex,
    onSelectMention,
    handleChange: handleMentionChange,
    handleKeyDown: handleMentionKeyDown,
    textareaRef,
    getMentionedUserIds,
    closeMention,
  } = useMentionInput();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - files.length;
    const toAdd = selected.slice(0, remaining);
    setFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const imageUrls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "rivora/posts");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.success) {
          setError("Failed to upload one or more images. Try again.");
          setLoading(false);
          return;
        }
        imageUrls.push(json.data.url);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          images: imageUrls,
          visibility,
          mentionedUserIds: getMentionedUserIds(),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to post. Try again.");
        setLoading(false);
        return;
      }

      setContent("");
      setFiles([]);
      setPreviews([]);
      setVisibility("public");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canPost = (content.trim().length > 0 || files.length > 0) && !loading;

  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {userImage ? (
              <Image src={userImage} alt={userName} fill sizes="40px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>

          {/* Input area */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleMentionChange}
              onKeyDown={handleMentionKeyDown}
              onBlur={closeMention}
              placeholder={`What's on your mind, ${userName.split(" ")[0]}?`}
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 placeholder:text-[var(--text-muted)]"
              style={{ background: "var(--surface-hover)", color: "var(--text-primary)" }}
            />

            {/* Mention dropdown */}
            {mentionQuery !== null && (
              <MentionDropdown
                users={mentionUsers}
                loading={mentionLoading}
                query={mentionQuery}
                selectedIndex={selectedIndex}
                onSelect={onSelectMention}
              />
            )}

            {/* Image previews */}
            {previews.length > 0 && (
              <div
                className={`mt-2 grid gap-1 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-video overflow-hidden rounded-xl"
                    style={{ background: "var(--surface-hover)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-xs text-accent">
            {error}
          </p>
        )}

        {/* Footer */}
        <div
          className="mt-3 flex items-center justify-between border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-1">
            {files.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={onFilesSelected}
            />

            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              className="rounded-lg border-none px-2 py-1.5 text-xs font-medium outline-none hover:bg-[var(--surface-hover)]"
              style={{ background: "transparent", color: "var(--text-muted)" }}
            >
              <option value="public">🌐 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="only_me">🔒 Only me</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canPost}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
