import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    // globalMessages are only written in the browser.
    vi.stubGlobal("window", {});
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

  describe("loadTournament", () => {
    it("fetches a single tournament with JSON:API headers", async () => {
      const mockResponse = {
        data: {
          id: "29",
          type: "tournaments",
          attributes: { name: "GNK", format_name: "Standard", has_elimination_stage: true },
        },
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadTournament(29, mockFetch);

      expect(result.tournament.id).toBe(29);
      expect(result.tournament.name).toBe("GNK");
      expect(result.tournament.format_name).toBe("Standard");
      expect(result.tournament.has_elimination_stage).toBe(true);
      const { url, headers } = getFetchCall();
      expect(url).toContain("/api/v1/public/tournaments/29");
      expect(headers.Accept).toBe("application/vnd.api+json");
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 404, statusText: "Not Found" }));

      await expect(api.loadTournament(29, mockFetch)).rejects.toThrow();
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

  describe("loadCurrentUser", () => {
    it("fetches current user with JSON:API headers and returns data on 200", async () => {
      const mockResponse = {
        data: {
          id: "42",
          type: "users",
          attributes: {
            nrdb_id: 12345,
            nrdb_username: "runner_one",
          },
        },
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadCurrentUser(mockFetch);

      expect(result).toEqual(mockResponse);
      const { url, headers } = getFetchCall();
      expect(url).toBe("https://tournaments.nullsignal.games/api/v1/private/user");
      expect(headers.Accept).toBe("application/vnd.api+json");
    });

    it("returns null on 401 or failure without pushing global error", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ errors: [{ status: "401" }] }), {
          status: 401,
          statusText: "Unauthorized",
        }),
      );

      const result = await api.loadCurrentUser(mockFetch);

      expect(result).toBeNull();
      expect(globalMessages.errors).toHaveLength(0);
    });
  });

  describe("loadIdentities", () => {
    it("fetches identities and returns data array on 200", async () => {
      const mockIdentities = [
        {
          id: "1",
          type: "identities",
          attributes: {
            name: "Haas-Bioroid: Precision Design",
            autocomplete: "Haas-Bioroid: Precision Design",
            faction: "haas-bioroid",
            nrdb_code: "30030",
            side: "corp",
          },
        },
      ];
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: mockIdentities }), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadIdentities(mockFetch);

      expect(result).toEqual(mockIdentities);
      const { url, headers } = getFetchCall();
      expect(url).toBe("https://tournaments.nullsignal.games/api/v1/public/identities");
      expect(headers.Accept).toBe("application/vnd.api+json");
    });

    it("pushes error to globalMessages and returns empty array on failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );

      const result = await api.loadIdentities(mockFetch);

      expect(result).toEqual([]);
      expect(globalMessages.errors).toHaveLength(1);
      expect(globalMessages.errors[0]).toContain("Failed to load identities");
    });
  });

  describe("loadIdentityNames", () => {
    it("fetches identities and adapts them to IdentityNames", async () => {
      const mockIdentities = [
        {
          id: "1",
          type: "identities",
          attributes: {
            name: "Haas-Bioroid: Precision Design",
            autocomplete: "Haas-Bioroid: Precision Design",
            faction: "haas-bioroid",
            nrdb_code: "30030",
            side: "corp",
          },
        },
      ];
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: mockIdentities }), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadIdentityNames(mockFetch);

      expect(result).toEqual({
        corp: [{ label: "Haas-Bioroid: Precision Design", value: "Haas-Bioroid: Precision Design" }],
        runner: [],
      });
    });
  });

  describe("playersApiUrl", () => {
    it("builds query with default include parameters", () => {
      const url = api.playersApiUrl(42);
      const [path, queryString] = url.split("?");
      expect(path).toBe("/api/v1/public/tournaments/42/players");

      const params = new URLSearchParams(queryString);
      expect(params.get("include")).toBe("corp_identity,runner_identity");
      expect(params.has("filter[user_id]")).toBe(false);
    });

    it("includes user_id filter when provided", () => {
      const url = api.playersApiUrl(42, { userId: 10 });
      const [path, queryString] = url.split("?");
      expect(path).toBe("/api/v1/public/tournaments/42/players");

      const params = new URLSearchParams(queryString);
      expect(params.get("filter[user_id]")).toBe("10");
      expect(params.get("include")).toBe("corp_identity,runner_identity");
    });
  });

  describe("loadPlayers", () => {
    it("fetches players with JSON:API headers and returns data on 200", async () => {
      const mockResponse = {
        data: [{ id: "5", type: "players", attributes: { name: "Evie" } }],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const result = await api.loadPlayers(42, undefined, mockFetch);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { headers } = getFetchCall();
      expect(headers.Accept).toBe("application/vnd.api+json");
    });

    it("pushes error to globalMessages and returns empty data on failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );

      const result = await api.loadPlayers(42, undefined, mockFetch);

      expect(result).toEqual({ data: [] });
      expect(globalMessages.errors).toHaveLength(1);
      expect(globalMessages.errors[0]).toContain("Failed to load players");
    });
  });

  describe("loadPlayerByUserId", () => {
    it("fetches players filtered by userId and adapts player when found", async () => {
      const mockResponse = {
        data: [
          {
            id: "5",
            type: "players",
            attributes: {
              tournament_id: 42,
              user_id: 10,
              name: "Evie",
              pronouns: "she/her",
              active: true,
            },
          },
        ],
        included: [
          {
            id: "100",
            type: "identities",
            attributes: {
              name: "Haas-Bioroid: Precision Design",
              faction: "haas-bioroid",
            },
          },
        ],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const player = await api.loadPlayerByUserId(42, 10, mockFetch);

      expect(player.id).toBe(5);
      expect(player.name).toBe("Evie");
      expect(player.user_id).toBe(10);
      expect(player.name_with_pronouns).toBe("Evie (she/her)");
    });

    it("returns default Player with id 0 and user_id when not found", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/vnd.api+json" },
        }),
      );

      const player = await api.loadPlayerByUserId(42, 999, mockFetch);

      expect(player.id).toBe(0);
      expect(player.user_id).toBe(999);
    });
  });
});
