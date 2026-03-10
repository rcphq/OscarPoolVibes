"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";

interface WinnerRevealProps {
  isCorrect: boolean;
  type: "firstChoice" | "runnerUp";
  children: React.ReactNode;
}

export function WinnerReveal({ isCorrect, type, children }: WinnerRevealProps) {
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "shimmer" | "glow"
  >("initial");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isCorrect || hasAnimated.current || prefersReducedMotion) return;
    hasAnimated.current = true;

    setAnimationPhase("shimmer");

    // Transition to pulsing glow after shimmer completes
    const timer = setTimeout(() => {
      setAnimationPhase("glow");
    }, 1500);

    return () => clearTimeout(timer);
  }, [isCorrect, prefersReducedMotion]);

  // Not correct — render children plainly
  if (!isCorrect) {
    return <>{children}</>;
  }

  const isGold = type === "firstChoice";

  // Reduced motion: static border/badge instead of animation
  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "relative rounded-lg border-2 p-0.5",
          isGold
            ? "border-gold-400 bg-gold-400/10"
            : "border-border bg-muted/30"
        )}
      >
        <div
          className={cn(
            "absolute -top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold",
            isGold
              ? "bg-gold-400 text-navy-dark"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isGold ? "Correct!" : "Runner-up"}
        </div>
        {children}
      </div>
    );
  }

  // Gold shimmer gradient
  const goldShimmer =
    "linear-gradient(110deg, transparent 25%, rgba(201, 168, 76, 0.4) 37%, rgba(255, 215, 0, 0.25) 50%, rgba(201, 168, 76, 0.4) 63%, transparent 75%)";

  // Silver shimmer gradient
  const silverShimmer =
    "linear-gradient(110deg, transparent 25%, rgba(192, 192, 192, 0.35) 37%, rgba(220, 220, 220, 0.2) 50%, rgba(192, 192, 192, 0.35) 63%, transparent 75%)";

  const shimmerGradient = isGold ? goldShimmer : silverShimmer;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 p-0.5",
        isGold ? "border-gold-400" : "border-border",
        animationPhase === "glow" && isGold && "animate-[glow-pulse_2s_ease-in-out_infinite]",
        animationPhase === "glow" && !isGold && "animate-[glow-pulse-silver_2s_ease-in-out_infinite]"
      )}
    >
      {/* Shimmer overlay */}
      {animationPhase === "shimmer" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-lg"
          style={{
            backgroundImage: shimmerGradient,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out forwards",
          }}
        />
      )}

      {/* Confetti for first choice */}
      {isGold && animationPhase === "shimmer" && <Confetti />}

      {children}
    </div>
  );
}
