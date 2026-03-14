"use client";

import { useEffect, useState } from "react";

export function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) return null;

  const isZero =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isZero) return null;

  return (
    <div className="mx-auto mt-6 flex justify-center gap-4 text-center">
      <div className="flex flex-col rounded-md border border-gold-500/20 bg-background/50 p-3 shadow-lg backdrop-blur-md">
        <span className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">{timeLeft.days}</span>
        <span className="text-xs uppercase text-gold-100/70">Days</span>
      </div>
      <div className="flex flex-col rounded-md border border-gold-500/20 bg-background/50 p-3 shadow-lg backdrop-blur-md">
        <span className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">{timeLeft.hours}</span>
        <span className="text-xs uppercase text-gold-100/70">Hours</span>
      </div>
      <div className="flex flex-col rounded-md border border-gold-500/20 bg-background/50 p-3 shadow-lg backdrop-blur-md">
        <span className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">{timeLeft.minutes}</span>
        <span className="text-xs uppercase text-gold-100/70">Mins</span>
      </div>
      <div className="flex flex-col rounded-md border border-gold-500/20 bg-background/50 p-3 shadow-lg backdrop-blur-md">
        <span className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">{timeLeft.seconds}</span>
        <span className="text-xs uppercase text-gold-100/70">Secs</span>
      </div>
    </div>
  );
}
