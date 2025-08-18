"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";

type ChatConversationProps = {
  children: ReactNode;
};

// Simple window-based "stick to bottom" behavior:
// - Tracks if user is near the bottom of the window
// - Automatically scrolls to bottom when new content is added and user is near bottom
const SCROLL_THRESHOLD_PX = 200; // how close to bottom counts as "at bottom"

function useWindowStickToBottom() {
  const [isAtBottom, setIsAtBottom] = useState(true);

  const recomputeIsAtBottom = useCallback(() => {
    const doc = document.documentElement;
    const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - SCROLL_THRESHOLD_PX;
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    // Initial compute on mount
    recomputeIsAtBottom();

    // Listen to scroll and resize to keep state in sync
    const onScrollOrResize = () => recomputeIsAtBottom();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [recomputeIsAtBottom]);

  const scrollToBottom = useCallback(() => {
    const doc = document.documentElement;
    window.scrollTo({ top: doc.scrollHeight, behavior: "smooth" });
  }, []);

  return { isAtBottom, scrollToBottom };
}

export function ChatConversation(props: ChatConversationProps) {
  const { isAtBottom, scrollToBottom } = useWindowStickToBottom();

  // When children change, if the user is at/near bottom, keep them pinned to bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [props.children, isAtBottom, scrollToBottom]);

  return (
    <div role="log" aria-live="polite" aria-relevant="additions" className="w-full">
      <div className="max-w-2xl mx-auto p-4">{props.children}</div>
    </div>
  );
}
