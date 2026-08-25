const BASE_URL_RAW = process.env.NEXT_PUBLIC_API_BASE_URL;

function normalizeBaseUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted.replace(/\/$/, "");
}

const BASE_URL = normalizeBaseUrl(BASE_URL_RAW);

function isLocalBrowserHost(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function resolveBaseUrl(): string {
  if (BASE_URL && BASE_URL !== "/api") return BASE_URL;
  if (BASE_URL === "/api" && !isLocalBrowserHost()) return "";
  return BASE_URL;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function requireBaseUrl(): string {
  const resolved = resolveBaseUrl();
  if (!resolved) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  return resolved;
}

export function getApiBaseUrlForDisplay(): string {
  return resolveBaseUrl() || "";
}

export async function request<T>(path: string, options: { method?: string; body?: unknown; token?: string; credentials?: RequestCredentials } = {},): Promise<T> {
  const url = `${requireBaseUrl()}${path}`;
  const method = options.method ?? "GET";
  const res = await fetch(url, {
    method,
    credentials: options.credentials,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }

  return res.json() as Promise<T>;
}
