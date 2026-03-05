"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" className="size-9">
        <Monitor className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (theme === "dark") setTheme("light");
        else if (theme === "light") setTheme("system");
        else setTheme("dark");
      }}
      aria-label={`Current theme: ${theme}. Click to change.`}
      className="size-9"
    >
      {theme === "dark" ? (
        <Moon className="size-4" />
      ) : theme === "light" ? (
        <Sun className="size-4" />
      ) : (
        <Monitor className="size-4" />
      )}
    </Button>
  );
}
