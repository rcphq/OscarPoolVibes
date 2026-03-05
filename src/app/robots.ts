import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/pools/", "/admin/", "/api/", "/results/"],
      },
    ],
    sitemap: "https://oscarpoolvibes.com/sitemap.xml",
  };
}
