import Link from "next/link";

/**
 * Splits text by @username patterns and renders each mention as a
 * teal-colored clickable link to that user's profile page.
 */
export function renderWithMentions(text: string) {
  const parts = text.split(/(@\w+)/g);

  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      const username = part.slice(1);
      return (
        <Link
          key={i}
          href={`/${username}`}
          className="font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
