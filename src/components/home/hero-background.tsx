"use client";

import { useEffect, useRef } from "react";

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const makeParticles = () =>
      Array.from({ length: 40 }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random(),
        velocity: (Math.random() - 0.5) * 0.2,
        pulse: Math.random() * 0.02,
      }));

    let particles = makeParticles();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-randomize positions so particles are distributed across the new canvas size.
      particles = makeParticles();
    };

    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.alpha += p.pulse;
        if (p.alpha <= 0.1 || p.alpha >= 0.8) {
          p.pulse *= -1;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        // Hardcoded gold value (#D4AF37) — CSS custom properties are not available
        // in Canvas 2D context, so this intentionally diverges from the CSS token.
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-navy">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-500/10 via-background to-background" />
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40 mix-blend-screen" />
    </div>
  );
}
