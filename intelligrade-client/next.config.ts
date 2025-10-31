import type { NextConfig } from "next";

const normalizeOrigin = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
};

const INTERNAL_STRAPI_ORIGIN =
  normalizeOrigin(process.env.NEXT_STRAPI_INTERNAL_ORIGIN) ??
  normalizeOrigin(process.env.NEXT_PRIVATE_STRAPI_INTERNAL_ORIGIN) ??
  normalizeOrigin(process.env.NEXT_PUBLIC_STRAPI_INTERNAL_ORIGIN) ??
  "http://127.0.0.1:1337";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["images.unsplash.com", "localhost", "47.82.94.221"],
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    return [
      {
        source: "/strapi/api/:path*",
        destination: `${INTERNAL_STRAPI_ORIGIN}/api/:path*`,
      },
      {
        source: "/strapi/uploads/:path*",
        destination: `${INTERNAL_STRAPI_ORIGIN}/uploads/:path*`,
      },
      {
        source: "/strapi/pdf/:path*",
        destination: `${INTERNAL_STRAPI_ORIGIN}/pdf/:path*`,
      },
      {
        source: "/strapi/pipeline/:path*",
        destination: `${INTERNAL_STRAPI_ORIGIN}/pipeline/:path*`,
      },
    ];
  },
};

export default nextConfig;
