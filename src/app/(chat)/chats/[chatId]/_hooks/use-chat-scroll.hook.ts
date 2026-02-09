"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ScrollRestoreInfo } from "../_contexts/chat-branches.context";

interface UseChatScrollParams {
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
  firstMessageId: string | undefined;
  scrollRestoreRef: React.MutableRefObject<ScrollRestoreInfo | null>;
  loadMore: () => void;
  hasMoreMessages: boolean;
  /** Refs written by loadMore, read by prepend scroll correction */
  previousHeightRef: React.MutableRefObject<number>;
  previousScrollYRef: React.MutableRefObject<number>;
  justPrependedRef: React.MutableRefObject<boolean>;
}

export interface ScrollActions {
  scrollToLatestMessage: () => void;
}

interface UseChatScrollReturn {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  initialScrollDone: boolean;
  scrollToLatestMessage: () => void;
}

export function useChatScroll({
  containerRef,
  isStreaming,
  firstMessageId,
  scrollRestoreRef,
  loadMore,
  hasMoreMessages,
  previousHeightRef,
  previousScrollYRef,
  justPrependedRef,
}: UseChatScrollParams): UseChatScrollReturn {
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll tracking refs
  const userScrolledAwayRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const autoScrollRafRef = useRef<number | null>(null);

  // Effect 1: Scroll to bottom on initial load (instant)
  useEffect(() => {
    window.requestAnimationFrame(() => {
      const scrollY = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
      );
      try {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      } catch {
        window.scrollTo(0, scrollY);
      }
      setInitialScrollDone(true);
    });
  }, []);

  // Effect 2: IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!initialScrollDone) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "400px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
    // Include firstMessageId to re-setup observer when messages change (branch switch, etc.)
  }, [initialScrollDone, loadMore, firstMessageId]);

  // Effect 3: Correct scroll position after prepending older messages.
  // Uses useLayoutEffect to run before paint, preventing visual jump.
  useLayoutEffect(() => {
    if (!justPrependedRef.current) return;
    justPrependedRef.current = false;

    const addedHeight =
      (containerRef.current?.scrollHeight ?? 0) - previousHeightRef.current;
    window.scrollTo(0, previousScrollYRef.current + addedHeight);
  }, [firstMessageId, containerRef, justPrependedRef, previousHeightRef, previousScrollYRef]);

  // Effect 4: Scroll restoration after branch switch (narrowed deps)
  // Previously depended on [messages, scrollRestoreRef] which re-ran on every
  // streaming token. Now depends on [firstMessageId] which only changes on
  // branch switch or prepend — not during streaming.
  useLayoutEffect(() => {
    const restoreInfo = scrollRestoreRef.current;
    if (!restoreInfo) return;

    // Clear the ref immediately to prevent re-triggering
    scrollRestoreRef.current = null;

    const { parentId, offsetFromTop } = restoreInfo;

    if (parentId) {
      const parentElement = document.querySelector(
        `[data-message-id="${parentId}"]`,
      );
      if (parentElement) {
        const rect = parentElement.getBoundingClientRect();
        const scrollDelta = rect.top - offsetFromTop;
        window.scrollBy({ top: scrollDelta, behavior: "smooth" });
      }
    }
  }, [firstMessageId, scrollRestoreRef]);

  // Effect 5: Detect user scrolling away during streaming to disable auto-scroll
  useEffect(() => {
    if (!isStreaming) {
      userScrolledAwayRef.current = false;
      return;
    }

    const handleScroll = () => {
      const currentScrollTop = window.scrollY;
      const maxScrollTop =
        document.documentElement.scrollHeight - window.innerHeight;
      const distanceFromBottom = maxScrollTop - currentScrollTop;

      if (distanceFromBottom > 150) {
        if (currentScrollTop < lastScrollTopRef.current - 10) {
          userScrolledAwayRef.current = true;
        }
      } else {
        userScrolledAwayRef.current = false;
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isStreaming]);

  // Effect 7: Auto-scroll during streaming to keep new content visible
  useEffect(() => {
    if (!isStreaming) {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }

    const scrollToBottom = () => {
      autoScrollRafRef.current = requestAnimationFrame(scrollToBottom);

      if (userScrolledAwayRef.current) return;

      const maxScrollTop =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentScrollTop = window.scrollY;

      if (maxScrollTop - currentScrollTop > 5) {
        window.scrollTo({
          top: maxScrollTop,
          behavior: "auto",
        });
      }
    };

    autoScrollRafRef.current = requestAnimationFrame(scrollToBottom);

    return () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
    };
  }, [isStreaming]);

  // Replaces Effect 6: imperative callback for scrolling to the latest message
  const scrollToLatestMessage = useCallback(() => {
    userScrolledAwayRef.current = false;
    requestAnimationFrame(() => {
      const allMessages = document.querySelectorAll("[data-message-id]");
      const lastMessage = allMessages[allMessages.length - 1];
      if (lastMessage) {
        const rect = lastMessage.getBoundingClientRect();
        const targetOffset = window.innerHeight * 0.2;
        const scrollTo = window.scrollY + rect.top - targetOffset;
        window.scrollTo({ top: Math.max(0, scrollTo), behavior: "smooth" });
      }
    });
  }, []);

  return {
    sentinelRef,
    initialScrollDone,
    scrollToLatestMessage,
  };
}
