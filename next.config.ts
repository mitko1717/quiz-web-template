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
