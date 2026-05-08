import { config } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
    message: string,
  ) {
    super(message);
  }
}

const TOKEN_KEY = "structa.token";

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string | null) {
    if (typeof window === "undefined") return;
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  },
};

interface RequestOpts {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: Record<string, string>;
  // For server-side rendering of public endpoints
  noAuth?: boolean;
  /**
   * Number of automatic retries for *network-level* failures (status === 0)
   * and 5xx responses commonly produced by serverless cold starts. Each retry
   * uses exponential backoff (700ms, 1500ms, 3000ms…). Defaults to 3 for GET
   * requests and 2 for mutating requests.
   */
  retries?: number;
  /**
   * Hard timeout (in ms) for each individual attempt. Defaults to 25s, which
   * is enough to survive a Vercel serverless cold start of the NestJS app.
   */
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function shouldRetry(
  err: unknown,
  attempt: number,
  maxAttempts: number,
): boolean {
  if (attempt >= maxAttempts) return false;
  if (err instanceof ApiError) {
    if (err.status === 0) return true;
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return true;
    }
  }
  return false;
}

async function singleAttempt<T>(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
  externalSignal: AbortSignal | undefined,
  cache: RequestCache | undefined,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Forward external aborts
  let externalAbortHandler: (() => void) | null = null;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else {
      externalAbortHandler = () => controller.abort();
      externalSignal.addEventListener("abort", externalAbortHandler);
    }
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache,
    });
  } catch (err) {
    throw new ApiError(0, null, (err as Error).message ?? "network error");
  } finally {
    clearTimeout(timer);
    if (externalSignal && externalAbortHandler) {
      externalSignal.removeEventListener("abort", externalAbortHandler);
    }
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      (data as { message?: string | string[] })?.message instanceof Array
        ? (data as { message: string[] }).message.join("; ")
        : (data as { message?: string })?.message ??
          `Request failed (${res.status})`;
    throw new ApiError(res.status, data, msg);
  }
  return data as T;
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };
  const token = auth.getToken();
  if (token && !opts.noAuth) headers.Authorization = `Bearer ${token}`;

  const method = opts.method ?? "GET";
  const isIdempotent = method === "GET";
  const maxAttempts =
    (opts.retries ?? (isIdempotent ? 3 : 2)) + 1; // +1 for the initial try
  const timeoutMs = opts.timeoutMs ?? 25_000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await singleAttempt<T>(
        url,
        method,
        headers,
        opts.body,
        opts.signal,
        opts.cache,
        timeoutMs,
      );
    } catch (err) {
      lastErr = err;
      if (!shouldRetry(err, attempt, maxAttempts)) break;
      // Exponential backoff: 700ms, 1500ms, 3000ms…
      const backoff = Math.min(700 * Math.pow(2, attempt - 1), 4000);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

// Convenience helpers

export const apiGet = <T,>(p: string, opts?: RequestOpts) =>
  api<T>(p, { ...opts, method: "GET" });

export const apiPost = <T,>(p: string, body?: unknown, opts?: RequestOpts) =>
  api<T>(p, { ...opts, method: "POST", body });
