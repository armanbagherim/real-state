import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "آشیان | مدیریت املاک",
    short_name: "آشیان",
    description: "دستیار روزانه دفتر املاک",
    lang: "fa",
    dir: "rtl",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9fa",
    theme_color: "#147d70",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
