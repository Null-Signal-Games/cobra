import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiBase } from "$lib/api/apiBase";
import { ok, err, type StatusOr } from "$lib/api/statusOr";
import * as csrfModule from "$lib/csrf";

describe("ApiBase with StatusOr", () => {
  const mockFetch = vi.fn<typeof fetch>();
  let api: ApiBase;

  function getFetchCall(callIndex = 0) {
    const [input, requestOptions] = mockFetch.mock.calls[callIndex];
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = (requestOptions?.headers ?? {}) as Record<string, string>;
    const body =
      typeof requestOptions?.body === "string"
        ? (JSON.parse(requestOptions.body) as Record<string, unknown>)
        : requestOptions?.body;
    return { url, requestOptions, headers, body };
  }

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(csrfModule, "csrfToken").mockReturnValue("mock-csrf-token");
    api = new ApiBase("https://tournaments.nullsignal.games", mockFetch);
  });

  describe("StatusOr constructors", () => {
    it("creates ok status", () => {
      const res = ok({ id: 1 }, 201);
      expect(res.ok).toBe(true);
      expect(res.status).toBe(201);
      expect(res.data).toEqual({ id: 1 });
      expect(res.error).toBeUndefined();
    });

    it("creates err status", () => {
      const error = new Error("Something went wrong");
      const res = err(error, 404);
      expect(res.ok).toBe(false);
      expect(res.status).toBe(404);
      expect(res.error).toBe(error);
      expect(res.data).toBeUndefined();
    });
  });

  describe("URL resolution", () => {
    it.each([
      { baseUrl: "https://tournaments.nullsignal.games/", path: "/test/path" },
      { baseUrl: "https://tournaments.nullsignal.games/", path: "test/path" },
      { baseUrl: "https://tournaments.nullsignal.games", path: "/test/path" },
      { baseUrl: "https://tournaments.nullsignal.games", path: "test/path" },
    ])("resolves $baseUrl with $path correctly", async ({ baseUrl, path }) => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      const apiInstance = new ApiBase(baseUrl, mockFetch);
      const res = await apiInstance.get(path);
      expect(res.ok).toBe(true);
      const { url } = getFetchCall(0);
      expect(url).toBe("https://tournaments.nullsignal.games/test/path");
    });
  });

  describe("get", () => {
    it("returns StatusOr with data on 200", async () => {
      const data = { id: 1, name: "Test" };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(data), { status: 200 }));

      const res: StatusOr<typeof data> = await api.get<typeof data>("/items/1");

      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
      expect(res.data).toEqual(data);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions, headers } = getFetchCall();
      expect(url).toBe("https://tournaments.nullsignal.games/items/1");
      expect(requestOptions?.method).toBe("GET");
      expect(requestOptions?.credentials).toBe("include");
      expect(headers.Accept).toBe("application/json");
      expect(headers["X-CSRF-Token"]).toBeUndefined();
    });

    it("returns StatusOr with error on bad JSON data", async () => {
      mockFetch.mockResolvedValueOnce(new Response("i am not JSON", { status: 200 }));

      const res = await api.get("/items/1");

      expect(res.ok).toBe(false);
      expect(res.status).toBe(200);
      expect(res.error).toBeDefined();
      expect(res.error?.message).toContain("is not valid JSON");
      expect(res.data).toBeUndefined();
    });

    it("returns StatusOr with error on 404 without throwing", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Item not found", { status: 404, statusText: "Not Found" }),
      );

      const res = await api.get("/items/999");

      expect(res.ok).toBe(false);
      expect(res.status).toBe(404);
      expect(res.error?.message).toContain("Item not found");
      expect(res.data).toBeUndefined();
    });

    it("handles network failure gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failed"));

      const res = await api.get("/items");

      expect(res.ok).toBe(false);
      expect(res.status).toBe(0);
      expect(res.error?.message).toBe("Network failed");
    });
  });

  describe("getOrThrow", () => {
    it("returns parsed data directly on 200", async () => {
      const data = { id: 1, name: "Test" };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(data), { status: 200 }));

      const result = await api.getOrThrow<typeof data>("/items/1");

      expect(result).toEqual(data);
    });

    it("accepts an altFetch function directly", async () => {
      const perRequestFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ custom: true }), { status: 200 }));

      const result = await api.getOrThrow<{ custom: boolean }>("/custom", perRequestFetch);

      expect(result).toEqual({ custom: true });
      expect(perRequestFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("throws Error on non-ok status", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Not found", { status: 404, statusText: "Not Found" }),
      );

      await expect(api.getOrThrow("/items/999")).rejects.toThrow("Not found");
    });

    it("throws Error with prefix when provided", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Server exploded", { status: 500, statusText: "Internal Server Error" }),
      );

      await expect(api.getOrThrow("/items/500", undefined, "Failed to load item")).rejects.toThrow(
        "Failed to load item: Server exploded",
      );
    });
  });

  describe("mutating requests (post, patch, delete)", () => {
    it("returns StatusOr on POST with serialized JSON body and auto CSRF token", async () => {
      const payload = { name: "Tournament 1" };
      const responseData = { id: 10, ...payload };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(responseData), { status: 201 }));

      const res = await api.post<typeof responseData>("/tournaments", payload);

      expect(res.ok).toBe(true);
      expect(res.status).toBe(201);
      expect(res.data).toEqual(responseData);
      const { requestOptions, headers, body } = getFetchCall();
      expect(requestOptions?.method).toBe("POST");
      expect(requestOptions?.credentials).toBe("include");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers.Accept).toBe("application/json");
      expect(headers["X-CSRF-Token"]).toBe("mock-csrf-token");
      expect(body).toEqual(payload);
    });

    it("extracts JSON error message on 422 validation failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "Confirmation name does not match the tournament name" }),
          { status: 422, statusText: "Unprocessable Entity" },
        ),
      );

      const res = await api.delete("/tournaments/42");

      expect(res.ok).toBe(false);
      expect(res.status).toBe(422);
      expect(res.error?.message).toBe("Confirmation name does not match the tournament name");
    });

    it("handles 204 No Content with undefined data", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const res = await api.delete("/tournaments/42");

      expect(res.ok).toBe(true);
      expect(res.status).toBe(204);
      expect(res.data).toBeUndefined();
    });
  });

  describe("action methods (boolean status)", () => {
    it("postAction returns true on 200 and false on error status", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
      const success = await api.postAction("/rounds/pair");
      expect(success).toBe(true);

      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));
      const failure = await api.postAction("/rounds/pair");
      expect(failure).toBe(false);
    });

    it("patchAction returns true on 200 and false on error status", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
      const success = await api.patchAction("/players/1/reinstate", { player: { id: 1 } });
      expect(success).toBe(true);
      const { requestOptions, body } = getFetchCall(0);
      expect(requestOptions?.method).toBe("PATCH");
      expect(body).toEqual({ player: { id: 1 } });

      mockFetch.mockResolvedValueOnce(new Response(null, { status: 422 }));
      const failure = await api.patchAction("/players/1/reinstate");
      expect(failure).toBe(false);
    });

    it("deleteAction returns true on 200 and false on error status", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
      const success = await api.deleteAction("/players/1");
      expect(success).toBe(true);
      const { requestOptions } = getFetchCall(0);
      expect(requestOptions?.method).toBe("DELETE");

      mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
      const failure = await api.deleteAction("/players/1");
      expect(failure).toBe(false);
    });
  });

  describe("custom fetch per request", () => {
    it("allows passing a custom fetch function in options", async () => {
      const perRequestFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ custom: true }), { status: 200 }));

      const res = await api.get<{ custom: boolean }>("/custom", { altFetch: perRequestFetch });

      expect(res.ok).toBe(true);
      expect(res.data).toEqual({ custom: true });
      expect(perRequestFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
