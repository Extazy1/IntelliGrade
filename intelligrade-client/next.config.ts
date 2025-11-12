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
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "47.82.94.221",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    // Backend API hosts - override with environment variables for production
    // Example: CHAT_API_HOST=http://47.82.94.221:8000 EDU_API_HOST=http://47.82.94.221:8000
    const CHAT_API_HOST = process.env.CHAT_API_HOST || "http://127.0.0.1:8000";
    const EDU_API_HOST = process.env.EDU_API_HOST || "http://127.0.0.1:8000";
    
    return [
      // Strapi API proxies
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
      // Chat API proxies (port 8000)
      {
        source: "/api/chat/:path*",
        destination: `${CHAT_API_HOST}/api/chat/:path*`,
      },
      // Education API proxies (port 8001)
      {
        source: "/api/edu/generate-lesson-plan",
        destination: `${EDU_API_HOST}/generate-lesson-plan`,
      },
      {
        source: "/api/edu/generate-feedback",
        destination: `${EDU_API_HOST}/generate-feedback`,
      },
      {
        source: "/api/edu/health",
        destination: `${EDU_API_HOST}/health`,
      },
    ];
  },
};

export default nextConfig;
