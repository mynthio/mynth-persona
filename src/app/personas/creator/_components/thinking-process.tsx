"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export function ThinkingProcess({
  content,
  isActive = true,
}: {
  content: string;
  isActive?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="w-full my-8 relative"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-surface-foreground/70">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-linear-to-br from-indigo-500/15 via-fuchsia-500/10 to-transparent">
            <SparkleIcon size={14} className="text-indigo-500" />
          </span>
          <span className="text-[0.85rem] font-onest font-medium tracking-wide">
            Shaping your persona
          </span>
        </div>

        <div className="flex items-center gap-2">
          <motion.span
            aria-hidden
            className="inline-block size-1.5 rounded-full bg-indigo-500"
            animate={{ opacity: isActive ? [0.35, 1, 0.35] : 0.35 }}
            transition={{ repeat: isActive ? Infinity : 0, duration: 1.1 }}
          />
          <span className="text-[0.8rem] font-onest text-surface-foreground/60">
            {isActive ? "Working…" : "Ready"}
          </span>
        </div>
      </div>

      <div className="relative rounded-2xl bg-linear-to-br from-background/70 via-background/55 to-surface-50/35 border border-surface-200/70 backdrop-blur-md overflow-hidden shadow-sm w-full">
        {/* Soft glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-44 rounded-full bg-fuchsia-500/10 blur-3xl" />

        {/* Gentle shimmer */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-24 w-48 opacity-35"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.18), transparent)",
          }}
          animate={{ x: [-80, 560] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
        />

        {/* Gradient Masks */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-linear-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-background to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="max-h-[240px] overflow-y-auto px-5 py-4 text-[0.95rem] leading-relaxed text-surface-foreground/75 scroll-smooth scrollbar-hide w-full"
        >
          <div className="whitespace-pre-wrap break-words w-full">
            {content}
            {isActive ? (
              <motion.span
                aria-hidden
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="inline-block w-2 h-4 ml-1 align-middle rounded-sm bg-indigo-500"
              />
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
