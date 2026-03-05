import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OscarPoolVibes",
    short_name: "OscarPool",
    description: "Create and manage Oscar prediction pools with friends",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f2e",
    theme_color: "#b3862a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
