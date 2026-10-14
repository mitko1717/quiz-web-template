import type { NextConfig } from "next";

function normalizeEnvUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted.replace(/\/$/, "");
}

function resolveApiProxyTarget(): string {
  const publicApiBaseUrl = normalizeEnvUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (publicApiBaseUrl && publicApiBaseUrl !== "/api") return publicApiBaseUrl;

  return "";
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://accounts.google.com https://appleid.cdn-apple.com https://sad.adsgram.ai",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              `connect-src 'self' ${normalizeEnvUrl(process.env.NEXT_PUBLIC_API_BASE_URL)} https://accounts.google.com https://appleid.apple.com https://sad.adsgram.ai https://api.adsgram.ai`,
              "frame-src https://accounts.google.com https://appleid.cdn-apple.com",
              "frame-ancestors https://web.telegram.org https://*.telegram.org",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    const apiBaseUrl = normalizeEnvUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    if (process.env.NODE_ENV !== "production" && apiBaseUrl !== "/api") {
      return [];
    }

    const target = resolveApiProxyTarget();
    if (!target) return [];

    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
