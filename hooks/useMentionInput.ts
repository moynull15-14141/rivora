"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

export type MentionUser = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

export function useMentionInput(initialValue = "") {
  const [value, setValue] = useState(initialValue);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Track username → id for users selected from the dropdown
  const [mentionedMap, setMentionedMap] = useState<Map<string, string>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) {
    const text = e.target.value;
    setValue(text);

    const cursor = e.target.selectionStart ?? text.length;
    const textBefore = text.slice(0, cursor);
    // Match @ followed by word chars at end of typed text
    const match = textBefore.match(/@(\w*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setSelectedIndex(0);

      clearTimeout(debounceRef.current);

      if (query.length === 0) {
        setMentionUsers([]);
        setMentionLoading(false);
        return;
      }

      setMentionLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/users/mention-search?q=${encodeURIComponent(query)}`
          );
          const json = await res.json();
          if (json.success) setMentionUsers(json.data);
        } catch {
          // ignore network errors — dropdown just stays empty
        } finally {
          setMentionLoading(false);
        }
      }, 300);
    } else {
      clearTimeout(debounceRef.current);
      setMentionQuery(null);
      setMentionUsers([]);
      setMentionLoading(false);
    }
  }

  function onSelectMention(user: MentionUser) {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? value.length;
    // Replace the partial "@query" with the full "@username "
    const before = value.slice(0, cursor).replace(/@\w*$/, "");
    const after = value.slice(cursor);
    const inserted = `@${user.username} `;
    const newValue = before + inserted + after;

    setValue(newValue);
    setMentionQuery(null);
    setMentionUsers([]);
    setMentionLoading(false);
    // Remember this user for getMentionedUserIds
    setMentionedMap((prev) => new Map(prev).set(user.username, user.id));

    // Restore cursor right after the inserted mention
    const newCursor = before.length + inserted.length;
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(newCursor, newCursor);
      }
    });
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) {
    if (mentionQuery === null) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, mentionUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && mentionUsers.length > 0) {
      e.preventDefault();
      const user = mentionUsers[selectedIndex];
      if (user) onSelectMention(user);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
      setMentionUsers([]);
    }
  }

  // Returns IDs of users that are still @mentioned in the current text
  function getMentionedUserIds(): string[] {
    const usernamesInText = [...value.matchAll(/@(\w+)/g)].map((m) => m[1]);
    const result: string[] = [];
    for (const [username, id] of mentionedMap.entries()) {
      if (usernamesInText.includes(username)) result.push(id);
    }
    return [...new Set(result)];
  }

  function closeMention() {
    setMentionQuery(null);
    setMentionUsers([]);
  }

  // Prefill a @username mention (used for Reply auto-fill)
  function prefillMention(user: MentionUser) {
    const prefilled = `@${user.username} `;
    setValue(prefilled);
    setMentionedMap((prev) => new Map(prev).set(user.username, user.id));
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  return {
    value,
    setValue,
    mentionQuery,
    mentionUsers,
    mentionLoading,
    selectedIndex,
    onSelectMention,
    handleChange,
    handleKeyDown,
    textareaRef,
    getMentionedUserIds,
    closeMention,
    prefillMention,
  };
}
