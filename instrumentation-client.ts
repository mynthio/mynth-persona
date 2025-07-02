import posthog from "posthog-js";

if (process.env.VERCEL_ENV === "production") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    capture_pageview: "history_change",
    capture_pageleave: true, // Enable pageleave capture
    capture_exceptions: true, // Enable capturing exceptions with Error Tracking
  });
}
