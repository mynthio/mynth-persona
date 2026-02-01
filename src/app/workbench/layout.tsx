import type { Metadata } from "next";

// Noindex for private workbench pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
