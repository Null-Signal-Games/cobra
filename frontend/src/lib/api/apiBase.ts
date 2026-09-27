import { COBRA_API_SERVER } from "$app/env/public";
import { csrfToken } from "$lib/csrf";
import type { StatusOr } from "$lib/api/statusOr";

export interface RequestOptions {
  altFetch?: typeof fetch;
  csrfToken?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  body?: unknown;
}

export class ApiBase {
  readonly baseUrl: string;
  readonly defaultFetch: typeof fetch;

  constructor(baseUrl?: string, defaultFetch: typeof fetch = fetch) {
    const rawUrl = baseUrl ?? (typeof COBRA_API_SERVER === "string" ? COBRA_API_SERVER : "");
    this.baseUrl = rawUrl.replace(/\/$/, "");
    this.defaultFetch = defaultFetch;
  }

  buildUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    if (!path.startsWith("/")) {
      return `${this.baseUrl}/${path}`;
    }
    return `${this.baseUrl}${path}`;
  }

  async rawRequest(path: string, method: string, options: RequestOptions = {}): Promise<Response> {
    const url = this.buildUrl(path);
    const activeFetch = options.altFetch ?? this.defaultFetch;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const isMutating = ["POST", "PATCH", "DELETE"].includes(method.toUpperCase());

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.csrfToken) {
      headers["X-CSRF-Token"] = options.csrfToken;
    } else if (isMutating) {
      const token = csrfToken();
      if (token) {
        headers["X-CSRF-Token"] = token;
      }
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const body =
      options.body !== undefined
        ? typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body)
        : undefined;

    return await activeFetch(url, {
      method,
      headers,
      credentials: options.credentials ?? "include",
      body,
    });
  }

  async request<T = void>(
    path: string,
    method: string,
    options: RequestOptions = {},
  ): Promise<StatusOr<T>> {
    let response: Response;
    try {
      response = await this.rawRequest(path, method, options);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      return { ok: false, status: 0, error };
    }

    const text = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (text.length > 0) {
        try {
          const parsed = JSON.parse(text) as { error?: string; errors?: unknown };
          if (typeof parsed.error === "string") {
            errorMessage = parsed.error;
          } else if (Array.isArray(parsed.errors)) {
            errorMessage = parsed.errors.join(", ");
          } else {
            errorMessage = text;
          }
        } catch {
          errorMessage = text;
        }
      }
      return {
        ok: false,
        status: response.status,
        error: new Error(errorMessage),
      };
    }

    if (response.status === 204 || text.length === 0) {
      return {
        ok: true,
        status: response.status,
        data: undefined as unknown as T,
      };
    }

    try {
      const data = JSON.parse(text) as T;
      return {
        ok: true,
        status: response.status,
        data,
      };
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Failed to parse response JSON");
      return {
        ok: false,
        status: response.status,
        error,
      };
    }
  }

  async get<T>(path: string, options?: RequestOptions): Promise<StatusOr<T>> {
    return this.request<T>(path, "GET", options);
  }

  async getOrThrow<T>(
    path: string,
    optionsOrFetch?: RequestOptions | typeof fetch,
    prefix = "",
  ): Promise<T> {
    const options =
      typeof optionsOrFetch === "function" ? { altFetch: optionsOrFetch } : optionsOrFetch;
    const res = await this.get<T>(path, options);
    if (!res.ok) {
      throw new Error(prefix ? `${prefix}: ${res.error.message}` : res.error.message);
    }
    return res.data;
  }

  async post<T = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<StatusOr<T>> {
    return this.request<T>(path, "POST", { ...options, body });
  }

  async patch<T = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<StatusOr<T>> {
    return this.request<T>(path, "PATCH", { ...options, body });
  }

  async delete<T = void>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<StatusOr<T>> {
    return this.request<T>(path, "DELETE", { ...options, body });
  }

  async action(
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
    options?: RequestOptions,
  ): Promise<boolean> {
    const res = await this.request(path, method, { ...options, body });
    return res.ok;
  }

  async postAction(path: string, body?: unknown, options?: RequestOptions): Promise<boolean> {
    return this.action(path, "POST", body, options);
  }

  async patchAction(path: string, body?: unknown, options?: RequestOptions): Promise<boolean> {
    return this.action(path, "PATCH", body, options);
  }

  async deleteAction(path: string, body?: unknown, options?: RequestOptions): Promise<boolean> {
    return this.action(path, "DELETE", body, options);
  }
}

export const api = new ApiBase();
