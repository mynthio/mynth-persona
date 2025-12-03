"use client";

import { useEffect, useRef, useState, useMemo } from "react";

interface SimpleMasonryProps<T> {
  items: T[];
  render: (item: T) => React.ReactNode;
  columnWidth?: number;
  maxColumnCount?: number;
  gap?: number;
  className?: string;
}

export function SimpleMasonry<T>({
  items,
  render,
  columnWidth = 250,
  maxColumnCount,
  gap = 16,
  className,
}: SimpleMasonryProps<T>) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      let newColumns = Math.max(
        1,
        Math.floor((width + gap) / (columnWidth + gap))
      );

      if (maxColumnCount) {
        newColumns = Math.min(newColumns, maxColumnCount);
      }

      setColumns(newColumns);
    };

    // Initial calculation
    updateColumns();

    const observer = new ResizeObserver(() => {
      updateColumns();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [columnWidth, gap, maxColumnCount]);

  const columnItems = useMemo(() => {
    const cols = Array.from({ length: columns }, () => [] as T[]);
    items.forEach((item, index) => {
      cols[index % columns].push(item);
    });
    return cols;
  }, [items, columns]);

  return (
    <div
      ref={containerRef}
      className={`flex w-full ${className || ""}`}
      style={{ gap }}
    >
      {columnItems.map((col, i) => (
        <div key={i} className="flex flex-col flex-1" style={{ gap }}>
          {col.map((item, j) => (
            <div key={j}>{render(item)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
