import type { Metadata } from "next";
import { Inter, Onest, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppRail } from "@/components/app-rail";
import { cookies } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Persona by mynth - AI Persona Generator",
    template: "%s | Persona by mynth",
  },
  description:
    "Create and customize AI personas with advanced AI models. Generate detailed character profiles, expand their stories, and create stunning images. Start for free with daily tokens or upgrade for unlimited creativity.",
  keywords: [
    "AI persona",
    "character generator",
    "AI models",
    "persona creation",
    "character development",
    "AI chat",
    "persona generator",
  ],
  authors: [{ name: "mynth" }],
  creator: "mynth",
  publisher: "mynth",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://persona.mynth.io"
  ),

  // Open Graph
  openGraph: {
    title: "Persona by mynth - AI Persona Generator",
    description:
      "Create and customize AI personas with advanced AI models. Generate detailed character profiles, expand their stories, and create stunning images.",
    url: "/",
    siteName: "Persona by mynth",
    locale: "en_US",
    type: "website",
    // images: [
    //   {
    //     url: "/og-image.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "Persona by mynth - AI Persona Generator",
    //   },
    // ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Persona by mynth - AI Persona Generator",
    description:
      "Create and customize AI personas with advanced AI models. Generate detailed character profiles, expand their stories, and create stunning images.",
    creator: "@mynth",
    // images: ["/twitter-image.png"],
  },

  // Icons and manifest
  // icons: {
  //   icon: [
  //     { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  //     { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  //     { url: "/favicon.svg", type: "image/svg+xml" },
  //   ],
  //   apple: [
  //     { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  //   ],
  //   other: [
  //     {
  //       url: "/android-chrome-192x192.png",
  //       sizes: "192x192",
  //       type: "image/png",
  //     },
  //     {
  //       url: "/android-chrome-512x512.png",
  //       sizes: "512x512",
  //       type: "image/png",
  //     },
  //   ],
  // },
  // manifest: "/site.webmanifest",

  // Additional metadata
  category: "Entertainment",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-site-verification",
    // yandex: "your-yandex-verification",
    // bing: "your-bing-site-verification",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarCookieValue = cookieStore.get("sidebar_state")?.value ?? "true";
  const defaultOpen = sidebarCookieValue === "true";

  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${onest.variable} ${spaceMono.variable} antialiased h-full text-foreground`}
      >
        <Providers>
          <SidebarProvider defaultOpen={defaultOpen} className="min-h-full">
            <AppRail />

            <AppSidebar />

            <div className="p-[8px] md:pl-0 min-h-full w-full flex flex-col md:block">
              <main className="h-full w-full min-w-0 min-h-0 self-center bg-surface border-[2.5px] border-black/70 text-surface-foreground rounded-[18px] relative">
                {children}
              </main>
              <div className="md:hidden shrink-0 h-[79px]" />
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
