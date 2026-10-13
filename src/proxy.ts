import { NextRequest, NextResponse } from "next/server";

function getApiConnectSource(): string {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configuredApiUrl || configuredApiUrl === "/api") return "";

  let apiUrl: URL;
  try {
    apiUrl = new URL(configuredApiUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL or /api");
  }

  if (apiUrl.protocol !== "http:" && apiUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS");
  }

  return apiUrl.origin;
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const apiConnectSource = getApiConnectSource();
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://appleid.cdn-apple.com https://sad.adsgram.ai${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${apiConnectSource} https://accounts.google.com https://appleid.apple.com https://sad.adsgram.ai https://api.adsgram.ai${isDevelopment ? " ws:" : ""}`,
    "frame-src https://accounts.google.com https://appleid.cdn-apple.com",
    "frame-ancestors https://web.telegram.org https://*.telegram.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://appleid.apple.com",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
