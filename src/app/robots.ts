import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prsna.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/chats/",
          "/library/",
          "/dashboard/",
          "/workbench/",
          "/api/",
          "/personas/creator/",
          "/scenarios/creator/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
