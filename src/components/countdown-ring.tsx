"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CountdownRing({
  endsAt,
  windowMs,
  className,
}: {
  endsAt: string;
  /** Total duration of this turn's countdown, used to size the ring's fill — shrinks in long bidding wars. */
  windowMs: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, new Date(endsAt).getTime() - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const fraction = Math.min(1, remainingMs / windowMs);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const urgent = remainingSec <= 5;

  return (
    <div className={cn("relative flex h-12 w-12 shrink-0 items-center justify-center", className)}>
      <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-[stroke-dashoffset] duration-200", urgent ? "text-rose-400" : "text-squad-accent")}
        />
      </svg>
      <span className={cn("absolute text-sm font-bold", urgent ? "text-rose-400" : "text-gray-100")}>
        {remainingSec}
      </span>
    </div>
  );
}
