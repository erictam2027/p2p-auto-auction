const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";

  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeUrl(window.location.origin);
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "";

  if (vercelUrl) {
    return normalizeUrl(`https://${vercelUrl}`);
  }

  return LOCAL_SITE_URL;
}

export function getSiteUrlPath(path: `/${string}`) {
  return `${getSiteUrl()}${path}`;
}
