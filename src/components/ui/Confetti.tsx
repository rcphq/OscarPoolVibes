"use client";

import { useEffect, useState } from "react";

interface ConfettiParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  driftDuration: number;
}

const GOLD_COLORS = [
  "#C9A84C",
  "#D4AF37",
  "#FFD700",
  "#B8860B",
  "#DAA520",
  "#E6BE8A",
];

const PARTICLE_COUNT = 18;

function generateParticles(): ConfettiParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.2 + Math.random() * 0.8,
    size: 4 + Math.random() * 4,
    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
    driftDuration: 0.8 + Math.random() * 0.6,
  }));
}

export function Confetti() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setVisible(false);
      return;
    }

    setParticles(generateParticles());

    // Auto-cleanup after animations complete
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible || particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-full"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards, confetti-drift ${p.driftDuration}s ease-in-out ${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
