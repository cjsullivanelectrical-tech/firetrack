import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FirePay",
    short_name: "FirePay",
    description:
      "Firefighter pay, rota and activity tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#dc2626",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/firepay-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/firepay-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
