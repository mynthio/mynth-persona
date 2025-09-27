"use client";

import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  useVirtualizer,
  useWindowVirtualizer,
  defaultRangeExtractor,
} from "@tanstack/react-virtual";
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";

type VirtualChatMessagesProps = {
  messages: PersonaUIMessage[];
  renderMessage: (message: PersonaUIMessage, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  estimateSize?: (index: number) => number;
  bottomPadding?: number;
  autoScrollToBottom?: boolean;
  useWindowScroller?: boolean;
  stickyHeaderIndex?: number | null;
};

export default function VirtualChatMessages(props: VirtualChatMessagesProps) {
  const {
    messages,
    renderMessage,
    className,
    overscan = 6,
    estimateSize,
    bottomPadding = 96,
    autoScrollToBottom = true,
    useWindowScroller = true,
    stickyHeaderIndex = null,
  } = props;

  const parentRef = useRef<HTMLDivElement | null>(null);
  const parentOffsetTopRef = useRef(0);

  // Compute scroll margin for window-based virtualizer
  useEffect(() => {
    parentOffsetTopRef.current = parentRef.current?.offsetTop ?? 0;
  }, []);

  const count = messages.length;

  const windowVirtualizer = useWindowVirtualizer({
    count,
    estimateSize: (index) => (estimateSize ? estimateSize(index) : 120),
    overscan,
    scrollMargin: parentOffsetTopRef.current,
    enabled: useWindowScroller,
    rangeExtractor: (range) => {
      if (stickyHeaderIndex == null) return defaultRangeExtractor(range);
      const next = new Set([
        stickyHeaderIndex,
        ...defaultRangeExtractor(range),
      ]);
      return [...next].sort((a, b) => a - b);
    },
  });

  const elementVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    overscan,
    estimateSize: (index) => (estimateSize ? estimateSize(index) : 120),
    enabled: !useWindowScroller,
    rangeExtractor: (range) => {
      if (stickyHeaderIndex == null) return defaultRangeExtractor(range);
      const next = new Set([
        stickyHeaderIndex,
        ...defaultRangeExtractor(range),
      ]);
      return [...next].sort((a, b) => a - b);
    },
  });

  const virtualizer = useMemo(
    () => (useWindowScroller ? windowVirtualizer : elementVirtualizer),
    [useWindowScroller, windowVirtualizer, elementVirtualizer]
  );

  // Auto scroll to the bottom on initial load
  useEffect(() => {
    if (!autoScrollToBottom || messages.length === 0) return;

    const id = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: "end",
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(id);
  }, []);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const scrollMargin = useWindowScroller
    ? (windowVirtualizer.options as any).scrollMargin ?? 0
    : 0;

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        // Only element-based virtualizer needs overflow container
        overflow: useWindowScroller ? undefined : "auto",
        paddingBottom: bottomPadding,
        // Give element-based virtualizer reasonable height if consumer doesn't pass one
        maxHeight: useWindowScroller ? undefined : "calc(100vh - 220px)",
      }}
    >
      <div
        style={{
          height: totalSize,
          position: "relative",
          width: "100%",
        }}
      >
        {virtualItems.map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              // Adjust for window scroller margin
              transform: `translateY(${item.start - scrollMargin}px)`,
            }}
          >
            {renderMessage(messages[item.index], item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
