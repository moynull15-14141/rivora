"use client";

import { useState } from "react";
import SearchModal from "./SearchModal";

export default function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] hover:text-primary"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Search people"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}
