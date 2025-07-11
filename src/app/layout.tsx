import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider>
            <AppSidebar />

            <main className="h-full w-full">{children}</main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
