"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "author-note-history";
const MAX_HISTORY = 5;

export interface AuthorNoteHistoryItem {
  id: string;
  content: string;
  createdAt: number;
}

function loadHistory(): AuthorNoteHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistory(items: AuthorNoteHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or disabled
  }
}

export function useAuthorNoteHistory() {
  const [history, setHistory] = useState<AuthorNoteHistoryItem[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addToHistory = useCallback((content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;

    setHistory((prev) => {
      // Skip if identical to most recent entry
      if (prev[0]?.content === trimmed) return prev;

      const newItem: AuthorNoteHistoryItem = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: trimmed,
        createdAt: Date.now(),
      };

      return [newItem, ...prev].slice(0, MAX_HISTORY);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addToHistory, clearHistory } as const;
}
