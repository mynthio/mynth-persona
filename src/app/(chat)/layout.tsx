import type { Metadata } from "next";

// Noindex for private chat pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
