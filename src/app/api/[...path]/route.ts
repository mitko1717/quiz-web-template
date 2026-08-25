import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeBackendUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "/api") return "";

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted === "/api" ? "" : unquoted.replace(/\/$/, "");
}

function resolveBackendUrl(): string {
  return normalizeBackendUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
}

function buildTargetUrl(request: NextRequest, path: string[]): string {
  const backendUrl = resolveBackendUrl();
  const targetUrl = new URL(`${backendUrl}/${path.join("/")}`);
  targetUrl.search = request.nextUrl.search;
  return targetUrl.toString();
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  return headers;
}

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const backendUrl = resolveBackendUrl();

  if (!backendUrl) {
    console.error("[web.api.proxy] Missing full NEXT_PUBLIC_API_BASE_URL for /api proxy.");
    return NextResponse.json(
      { error: "Missing full NEXT_PUBLIC_API_BASE_URL for /api proxy" },
      { status: 500 },
    );
  }

  const targetUrl = buildTargetUrl(request, path);

  const res = await fetch(targetUrl, {
    method,
    headers: buildForwardHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const { status, statusText, headers } = res;

  const responseHeaders = new Headers(headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(res.body, { status, statusText, headers: responseHeaders });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}