"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MiniWaveLoaderProps = React.HTMLAttributes<HTMLDivElement> & {
  rows?: number;
  cols?: number;
  speedMs?: number;
  size?: "xs" | "sm" | "md" | "lg";
};

/**
 * A compact, two-row wave loader ideal for inline loading states.
 * Optimized with memoized phase sequence and memoized component to avoid unnecessary re-renders.
 */
export const MiniWaveLoader = React.memo(function MiniWaveLoader({
  rows = 2,
  cols = 5,
  speedMs = 220,
  size = "sm",
  className,
  ...props
}: MiniWaveLoaderProps) {
  const phases = React.useMemo(() => {
    if (cols <= 1) return [0];
    const forward = Array.from({ length: cols }, (_, i) => i);
    const backward = Array.from(
      { length: Math.max(0, cols - 2) },
      (_, i) => cols - 2 - i
    );
    return [...forward, ...backward];
  }, [cols]);

  const [phaseIndex, setPhaseIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % phases.length);
    }, speedMs);
    return () => clearInterval(id);
  }, [phases.length, speedMs]);

  const phase = phases[phaseIndex] ?? 0;

  const sizeClasses = {
    xs: "w-1.5 h-1.5 gap-0.5",
    sm: "w-2 h-2 gap-0.5",
    md: "w-2.5 h-2.5 gap-0.5",
    lg: "w-3 h-3 gap-1",
  } as const;

  const [dotW, dotH, gap] = React.useMemo(() => {
    const parts = sizeClasses[size].split(" ");
    return [parts[0], parts[1], parts[2]] as const;
  }, [size]);

  return (
    <div
      {...props}
      className={cn("inline-grid", gap, className)}
      style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
      aria-busy
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const rowOffset = row === 1 ? 0.5 : 0; // ripple offset for bottom row
        const distance = Math.abs(col - (phase + rowOffset));

        const colorClass =
          distance < 0.5
            ? "bg-zinc-600 dark:bg-zinc-400"
            : distance < 1.5
            ? "bg-zinc-300 dark:bg-zinc-600"
            : "bg-zinc-200/70 dark:bg-zinc-700/60";

        return (
          <div
            key={i}
            className={cn(
              dotW,
              dotH,
              "rounded-[2px] transition-colors duration-200",
              colorClass
            )}
          />
        );
      })}
    </div>
  );
});
