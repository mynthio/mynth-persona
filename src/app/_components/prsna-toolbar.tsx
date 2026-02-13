"use client";

import { MailSend01Icon, StarsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import Form from "next/form";
import { useState, useRef } from "react";

export function PrsnaToolbar({ className }: { className?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "sticky bottom-4 w-full mx-auto max-w-2xl px-4 z-50 animate-slide-up",
        className
      )}
    >
      <div className="relative group">
        {/* Animated Glow Gradient */}
        <div
          className={cn(
            "absolute -inset-0.5 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md transition-all duration-500 opacity-0 group-hover:opacity-20",
            isFocused && "opacity-50 scale-102"
          )}
        />

        <Form
          action="/personas/creator"
          formMethod="GET"
          className="relative w-full"
        >
          <div
            className={cn(
              "relative flex items-center gap-3 p-2 pl-3 sm:pl-4 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 ring-1 ring-white/5 bg-background/60",
              isFocused ? "border-white/10" : "border-transparent"
            )}
          >
            {/* AI Icon */}
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  "text-muted-foreground/90 transition-transform duration-500",
                  isFocused && "scale-110"
                )}
              >
                <HugeiconsIcon icon={StarsIcon} strokeWidth={1.5} className="size-5" />
              </div>
            </div>

            <input
              ref={inputRef}
              name="prompt"
              type="text"
              placeholder="Describe your ideal persona..."
              className="flex-1 bg-transparent border-none outline-none h-11 sm:h-12 text-base sm:text-lg placeholder:text-muted-foreground/50 placeholder:font-light"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
            />

            {/* Submit Button */}
            <div className="flex items-center justify-center size-10">
              {value.length > 0 ? (
                <button
                  key="submit-btn"
                  type="submit"
                  className="bg-foreground text-background rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-90 transition-all animate-pop-in"
                >
                  <HugeiconsIcon icon={MailSend01Icon} className="size-4" strokeWidth={1.5} />
                </button>
              ) : (
                <div className="text-muted-foreground/20">
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
