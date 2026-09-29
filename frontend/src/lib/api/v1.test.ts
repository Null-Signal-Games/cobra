import { describe, it, expect, vi, beforeEach } from "vitest";
import { V1Api, v1Api } from "$lib/api/v1";
import { ApiBase } from "$lib/api/apiBase";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

describe("V1Api", () => {
  const mockFetch = vi.fn<typeof fetch>();
  let api: V1Api;

  function getFetchCall(callIndex = 0) {
    const [input, requestOptions] = mockFetch.mock.calls[callIndex];
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = (requestOptions?.headers ?? {}) as Record<string, string>;
    return { url, requestOptions, headers };
  }

  beforeEach(() => {
    vi.resetAllMocks();
    globalMessages.errors = [];
    const apiBase = new ApiBase("https://tournaments.nullsignal.games", mockFetch);
    api = new V1Api(apiBase);
  });

  it("exports a default singleton instance of V1Api", () => {
    expect(v1Api).toBeInstanceOf(V1Api);
  });

  describe("tournamentsApiUrl", () => {
    it("builds query with standard pagination and sorting when no type is provided", () => {
      const url = api.tournamentsApiUrl();
      const [path, queryString] = url.split("?");
      expect(path).toBe("/api/v1/public/tournaments");

      const params = new URLSearchParams(queryString);
      expect(params.get("page[size]")).toBe("10");
      expect(params.get("include")).toBe("tournament_type");
      expect(params.get("sort")).toBe("-date,name");
      expect(params.has("filter[tournament_type_id]")).toBe(false);
    });

    it("includes tournament type filter when specified", () => {
      const url = api.tournamentsApiUrl("42");
      const [path, queryString] = url.split("?");
      expect(path).toBe("/api/v1/public/tournaments");

      const params = new URLSearchParams(queryString);
      expect(params.get("filter[tournament_type_id]")).toBe("42");
    });
  });

  describe("loadTournaments", () => {
    it("fetches tournaments with JSON:API headers and returns data on 200", async () => {
      const mockResponse = {
        data: [{ id: "1", type: "tournaments", attributes: { name: "GNK" } }],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadTournaments("/api/v1/public/tournaments", mockFetch);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { headers } = getFetchCall();
      expect(headers.Accept).toBe("application/vnd.api+json");
    });

    it("pushes error to globalMessages and returns empty data on failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );

      const result = await api.loadTournaments("/api/v1/public/tournaments", mockFetch);

      expect(result).toEqual({ data: [] });
      expect(globalMessages.errors).toHaveLength(1);
      expect(globalMessages.errors[0]).toContain("Failed to load tournaments");
    });
  });

  describe("loadTournamentBySlug", () => {
    it("requests tournaments filtered by slug", async () => {
      const mockResponse = {
        data: [{ id: "10", type: "tournaments", attributes: { slug: "test-slug" } }],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadTournamentBySlug("test-slug", mockFetch);

      expect(result).toEqual(mockResponse);
      const { url } = getFetchCall();
      const [, queryString] = url.split("?");
      const params = new URLSearchParams(queryString);
      expect(params.get("filter[slug]")).toBe("test-slug");
    });
  });

  describe("loadTournamentTypes", () => {
    it("fetches tournament types and returns data array on 200", async () => {
      const mockTypes = [
        { id: "1", type: "tournament_types", attributes: { name: "GNK" } },
      ];
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: mockTypes }), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadTournamentTypes(mockFetch);

      expect(result).toEqual(mockTypes);
      const { headers } = getFetchCall();
      expect(headers.Accept).toBe("application/vnd.api+json");
    });

    it("pushes error to globalMessages and returns empty array on failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );

      const result = await api.loadTournamentTypes(mockFetch);

      expect(result).toEqual([]);
      expect(globalMessages.errors).toHaveLength(1);
      expect(globalMessages.errors[0]).toContain("Failed to load tournament types");
    });
  });
});
