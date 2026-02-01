import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Persona - AI Roleplay Chat & Character Generator",
    template: "%s | Persona",
  },
  description:
    "Create AI personas for immersive roleplay chat. Generate detailed characters with unique personalities, chat naturally, and create stunning AI character art. Free to start.",
  keywords: [
    "AI roleplay chat",
    "AI persona generator",
    "roleplay AI",
    "character AI",
    "AI companion chat",
    "AI character creator",
    "immersive AI chat",
    "AI character art",
    "chat with AI characters",
    "AI girlfriend",
    "AI boyfriend",
    "virtual companion",
  ],
  authors: [{ name: "Persona" }],
  creator: "Persona",
  publisher: "Persona",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://prsna.app"),

  // Open Graph
  openGraph: {
    title: "Persona - AI Roleplay Chat & Character Generator",
    description:
      "Create AI personas for immersive roleplay chat. Generate detailed characters with unique personalities, chat naturally, and create stunning AI character art.",
    url: "/",
    siteName: "Persona",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Persona - AI Roleplay Chat & Character Generator",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Persona - AI Roleplay Chat & Character Generator",
    description:
      "Create AI personas for immersive roleplay chat. Generate detailed characters with unique personalities, chat naturally, and create stunning AI character art.",
    creator: "@mynth",
    images: ["/og-image.png"],
  },

  // Icons and manifest
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",

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
  alternates: {
    canonical: "/",
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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Persona",
              url: "https://prsna.app",
              description:
                "Create AI personas for immersive roleplay chat. Generate detailed characters with unique personalities, chat naturally, and create stunning AI character art.",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free tier with daily tokens",
              },
              creator: {
                "@type": "Organization",
                name: "Mynth",
                url: "https://prsna.app",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased h-full z-0 relative`}
      >
        <Providers>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />

            <main className="relative flex h-full w-full flex-col">
              {children}
            </main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
