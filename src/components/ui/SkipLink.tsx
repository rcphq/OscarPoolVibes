"use client";

import { useCallback } from "react";

export function SkipLink() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById("main-content");
    if (main) {
      main.focus();
      main.scrollIntoView();
    }
  }, []);

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="fixed left-4 top-4 z-[100] -translate-y-16 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}
