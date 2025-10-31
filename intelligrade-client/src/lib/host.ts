const normalizeBaseUrl = (value: string | undefined | null) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
};

const DEFAULT_BROWSER_API_BASE = "/strapi/api";
const DEFAULT_BROWSER_ASSET_BASE = "/strapi";
const DEFAULT_SERVER_API_BASE = "http://127.0.0.1:1337/api";
const DEFAULT_SERVER_ASSET_BASE = "http://127.0.0.1:1337";

const getDefaultApiBase = () =>
  typeof window === "undefined"
    ? DEFAULT_SERVER_API_BASE
    : DEFAULT_BROWSER_API_BASE;

const getDefaultAssetBase = () =>
  typeof window === "undefined"
    ? DEFAULT_SERVER_ASSET_BASE
    : DEFAULT_BROWSER_ASSET_BASE;

export const API_HOST =
  normalizeBaseUrl(process.env.NEXT_PUBLIC_API_HOST) ?? getDefaultApiBase();

export const IMAGE_PREFIX =
  normalizeBaseUrl(process.env.NEXT_PUBLIC_IMAGE_PREFIX) ?? getDefaultAssetBase();
