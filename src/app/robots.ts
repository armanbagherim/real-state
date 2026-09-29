import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const app = [
  "/dashboard",
  "/properties",
  "/owners",
  "/contracts",
  "/follow-ups",
  "/reminders",
  "/settings",
  "/users",
  "/agents",
  "/offices",
  "/extension",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: app,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
