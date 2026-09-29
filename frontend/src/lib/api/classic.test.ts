import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClassicApi, classicApi } from "./classic";
import { ApiBase } from "./apiBase";
import { Tournament } from "$lib/model/Tournament";
import type { Stage } from "$lib/api/classicTypes";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
import * as csrfModule from "$lib/csrf";

describe("ClassicApi", () => {
  const mockFetch = vi.fn<typeof fetch>();
  let api: ClassicApi;

  function getFetchCall(callIndex = 0) {
    const [input, requestOptions] = mockFetch.mock.calls[callIndex];
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = (requestOptions?.headers ?? {}) as Record<string, string>;
    const body =
      typeof requestOptions?.body === "string"
        ? (JSON.parse(requestOptions.body) as Record<string, unknown>)
        : {};
    return { url, requestOptions, headers, body };
  }

  beforeEach(() => {
    vi.resetAllMocks();
    globalMessages.errors = [];
    globalMessages.warnings = [];
    globalMessages.infos = [];
    vi.spyOn(csrfModule, "csrfToken").mockReturnValue("mock-csrf-token");
    const apiBase = new ApiBase("https://tournaments.nullsignal.games", mockFetch);
    api = new ClassicApi(apiBase);
  });

  it("exports a default singleton instance of ClassicApi", () => {
    expect(classicApi).toBeInstanceOf(ClassicApi);
  });

  describe("loadPairingsForUser", () => {
    it("fetches pairings for a specific user successfully", async () => {
      const mockPairings = {
        tournament_id: 10,
        player_id: 5,
        round_number: 1,
        table_number: 2,
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockPairings), { status: 200 }),
      );

      const result = await api.loadPairingsForUser(10, 5, mockFetch);

      expect(result).toEqual(mockPairings);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url } = getFetchCall();
      expect(url).toContain("/tournaments/10/rounds/pairings_data/5");
    });

    it("returns null and pushes global error on failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const result = await api.loadPairingsForUser(10, 5, mockFetch);

      expect(result).toBeNull();
      expect(globalMessages.errors).toContain("Error loading pairings for user 5.");
    });
  });

  describe("loadStandings", () => {
    it("loads standings data via getOrThrow", async () => {
      const mockStandings = {
        standings: [],
        swiss_format: "double_sided",
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockStandings), { status: 200 }),
      );

      const result = await api.loadStandings(10, mockFetch);

      expect(result).toEqual(mockStandings);
      const { url } = getFetchCall();
      expect(url).toContain("/tournaments/10/players/standings_data");
    });
  });

  describe("loadBrackets", () => {
    it("loads bracket data via getOrThrow", async () => {
      const mockBracket = { stages: [] };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockBracket), { status: 200 }),
      );

      const result = await api.loadBrackets(10, mockFetch);

      expect(result).toEqual(mockBracket);
      const { url } = getFetchCall();
      expect(url).toContain("/tournaments/10/rounds/brackets");
    });
  });

  describe("loadNewTournament", () => {
    it("loads new tournament form data", async () => {
      const mockFormData = { tournament: {}, options: {} };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockFormData), { status: 200 }),
      );

      const result = await api.loadNewTournament(mockFetch);

      expect(result).toEqual(mockFormData);
      const { url } = getFetchCall();
      expect(url).toContain("/tournaments/new_form");
    });
  });

  describe("loadTournamentSettings", () => {
    it("loads tournament settings edit form data", async () => {
      const mockFormData = { tournament: { id: 10 }, options: {} };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockFormData), { status: 200 }),
      );

      const result = await api.loadTournamentSettings(10, mockFetch);

      expect(result).toEqual(mockFormData);
      const { url } = getFetchCall();
      expect(url).toContain("/tournaments/10/edit_form");
    });
  });

  describe("loadStage", () => {
    it("loads stage settings", async () => {
      const mockStage = {
        stage: { id: 1, tournament_id: 10, format: "Swiss" },
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockStage), { status: 200 }),
      );

      const result = await api.loadStage(10, 1, mockFetch);

      expect(result).toEqual(mockStage);
      const { url } = getFetchCall();
      expect(url).toContain("/tournaments/10/stages/1/settings");
    });
  });

  describe("createTournament", () => {
    it("posts new tournament data", async () => {
      const tournament = new Tournament({ name: "New Tourney" });
      const mockResponse = { id: 123, name: "New Tourney", url: "/tournaments/123" };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 }),
      );

      const result = await api.createTournament(tournament);

      expect(result).toEqual(mockResponse);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/tournaments");
      expect(requestOptions?.method).toBe("POST");
      expect(body).toEqual({ tournament });
    });
  });

  describe("updateTournamentSettings", () => {
    it("patches tournament settings and returns true", async () => {
      const tournament = new Tournament({ id: 10, name: "Updated Tourney" });
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await api.updateTournamentSettings(tournament);

      expect(result).toBe(true);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/tournaments/10");
      expect(requestOptions?.method).toBe("PATCH");
      expect(body).toEqual({ tournament });
    });
  });

  describe("saveStage", () => {
    it("patches stage settings", async () => {
      const stage: Stage = {
        id: 1,
        tournament_id: 10,
        number: 1,
        format: "Swiss",
        table_ranges: [{ id: 5, stage_id: 1, first_table: 1, last_table: 10 }],
      };
      const mockResponse = { url: "/tournaments/10/stages/1" };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await api.saveStage(10, stage, mockFetch);

      expect(result).toEqual(mockResponse);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/tournaments/10/stages/1");
      expect(requestOptions?.method).toBe("PATCH");
      expect(body).toEqual({ stage });
    });
  });
});
