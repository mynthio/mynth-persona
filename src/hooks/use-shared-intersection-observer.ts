import { useEffect, useRef, useState } from "react";

type ObserverCallback = (isIntersecting: boolean) => void;

// Shared observer instance and registry
let sharedObserver: IntersectionObserver | null = null;
const observerRegistry = new Map<Element, ObserverCallback>();

function getSharedObserver(threshold: number = 0.25): IntersectionObserver | null {
  if (!sharedObserver && typeof IntersectionObserver !== "undefined") {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const callback = observerRegistry.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        }
      },
      { threshold }
    );
  }
  return sharedObserver;
}

function registerElement(element: Element, callback: ObserverCallback): void {
  const observer = getSharedObserver();
  if (observer) {
    observerRegistry.set(element, callback);
    observer.observe(element);
  }
}

function unregisterElement(element: Element): void {
  const observer = getSharedObserver();
  if (observer) {
    observerRegistry.delete(element);
    observer.unobserve(element);
  }
}

/**
 * Hook that uses a shared IntersectionObserver across all instances.
 * Reduces memory overhead when many elements need intersection detection.
 */
export function useSharedIntersectionObserver<T extends Element>(): [
  React.RefObject<T | null>,
  boolean
] {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    registerElement(element, setIsIntersecting);

    return () => {
      unregisterElement(element);
    };
  }, []);

  return [ref, isIntersecting];
}

/**
 * Hook that registers an element with the shared observer and calls onIntersect once.
 * Pass an existing ref to observe.
 */
export function useSharedIntersectionEffect<T extends Element>(
  ref: React.RefObject<T | null>,
  onIntersect: () => void,
  enabled: boolean = true
): void {
  const hasTriggeredRef = useRef(false);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    const callback = (isIntersecting: boolean) => {
      if (isIntersecting && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        callbackRef.current();
        unregisterElement(element);
      }
    };

    registerElement(element, callback);

    return () => {
      if (element) {
        unregisterElement(element);
      }
    };
  }, [ref, enabled]);
}
