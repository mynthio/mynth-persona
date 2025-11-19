"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, Sparkles } from "lucide-react";
import Form from "next/form";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { Send01, Stars01 } from "@untitledui/icons";

export function PrsnaToolbar({ className }: { className?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "sticky bottom-4 w-full mx-auto max-w-2xl px-4 z-50",
        className
      )}
    >
      <div className="relative group">
        {/* Animated Glow Gradient */}
        <motion.div
          animate={{
            opacity: isFocused ? 0.5 : 0,
            scale: isFocused ? 1.02 : 0.98,
          }}
          className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md transition-all duration-500 opacity-0 group-hover:opacity-20"
        />

        <Form
          action="/personas/creator"
          formMethod="GET"
          className="relative w-full"
        >
          <motion.div
            layout
            animate={{
              height: "auto",
              borderColor: isFocused ? "rgba(255,255,255,0.1)" : "transparent",
            }}
            className={cn(
              "relative flex items-center gap-3 p-2 pl-4 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl transition-colors duration-300 ring-1 ring-white/5",
              "bg-background/60"
            )}
          >
            {/* AI Icon */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isFocused ? 1.1 : 1,
                }}
                transition={{ duration: 0.5 }}
                className="text-muted-foreground/90"
              >
                <Stars01 strokeWidth={1.5} className="size-5" />
              </motion.div>
            </div>

            <input
              ref={inputRef}
              name="prompt"
              type="text"
              placeholder="Describe your ideal persona..."
              className="flex-1 bg-transparent border-none outline-none h-12 text-lg placeholder:text-muted-foreground/50 placeholder:font-light"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
            />

            {/* Submit Button */}
            <div className="flex items-center justify-center size-10">
              <AnimatePresence mode="popLayout">
                {value.length > 0 ? (
                  <motion.button
                    key="submit-btn"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    className="bg-foreground text-background rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Send01 className="size-4" strokeWidth={1.5} />
                  </motion.button>
                ) : (
                  <motion.div
                    key="placeholder-icon"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="text-muted-foreground/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Form>
      </div>
    </motion.div>
  );
}
