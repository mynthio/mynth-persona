"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  } as const;

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Gradient ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          "bg-[conic-gradient(var(--tw-gradient-stops))] from-primary via-fuchsia-500 to-primary",
          "animate-spin [animation-duration:1.25s]"
        )}
        style={{ maskImage: "radial-gradient(transparent 52%, black 53%)", WebkitMaskImage: "radial-gradient(transparent 52%, black 53%)" }}
      />

      {/* Soft inner glow */}
      <div
        className={cn(
          "absolute inset-1 rounded-full",
          "bg-gradient-to-br from-primary/10 via-transparent to-fuchsia-500/10",
          "blur-[1px]"
        )}
      />

      {/* Center dot for balance */}
      <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70" />
    </div>
  );
}

// Alternative compact version for inline use
export function CompactSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className="relative w-5 h-5">
        {/* Gradient ring (compact) */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-[conic-gradient(var(--tw-gradient-stops))] from-primary via-fuchsia-500 to-primary",
            "animate-spin [animation-duration:1.1s]"
          )}
          style={{ maskImage: "radial-gradient(transparent 55%, black 56%)", WebkitMaskImage: "radial-gradient(transparent 55%, black 56%)" }}
        />
        {/* Subtle center */}
        <div className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70" />
      </div>
    </div>
  );
}