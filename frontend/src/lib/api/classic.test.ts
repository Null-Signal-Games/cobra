import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClassicApi, classicApi } from "./classic";
import { ApiBase } from "./apiBase";
import { Tournament } from "$lib/model/Tournament";
import type { DemoTournamentSettings, Stage } from "$lib/api/classicTypes";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
import { authStore } from "$lib/utils/auth.svelte";
import { ValidationError } from "$lib/utils/errors";

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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    // globalMessages are only written in the browser.
    vi.stubGlobal("window", {});
    vi.resetAllMocks();
    globalMessages.errors = [];
    globalMessages.warnings = [];
    globalMessages.infos = [];
    vi.spyOn(authStore, "getCsrfToken").mockResolvedValue("mock-csrf-token");
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
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockPairings), { status: 200 }));

      const result = await api.loadPairingsForUser(10, 5, mockFetch);

      expect(result).toEqual(mockPairings);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/rounds/pairings_data/5");
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
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockStandings), { status: 200 }));

      const result = await api.loadStandings(10, mockFetch);

      expect(result).toEqual(mockStandings);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/players/standings_data");
    });
  });

  describe("loadBrackets", () => {
    it("loads bracket data via getOrThrow", async () => {
      const mockBracket = { stages: [] };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockBracket), { status: 200 }));

      const result = await api.loadBrackets(10, mockFetch);

      expect(result).toEqual(mockBracket);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/rounds/brackets");
    });
  });

  describe("loadNewTournament", () => {
    it("loads new tournament form data", async () => {
      const mockFormData = { tournament: {}, options: {} };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockFormData), { status: 200 }));

      const result = await api.loadNewTournament(mockFetch);

      expect(result).toEqual(mockFormData);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/new_form");
    });
  });

  describe("loadNewDemoTournament", () => {
    it("fetches new demo tournament form data", async () => {
      const mockFormData = {
        tournament: {
          swiss_format: "single_sided",
          assign_ids: false,
        },
        csrf_token: "mock-csrf-token",
      };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockFormData), { status: 200 }));

      const result = await api.loadNewDemoTournament(mockFetch);

      expect(result).toEqual(mockFormData);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/new_demo_form");
    });

    it("handles failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );

      await expect(api.loadNewDemoTournament(mockFetch)).rejects.toThrow();
    });
  });

  describe("loadTournamentSettings", () => {
    it("loads tournament settings edit form data", async () => {
      const mockFormData = { tournament: { id: 10 }, options: {} };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockFormData), { status: 200 }));

      const result = await api.loadTournamentSettings(10, mockFetch);

      expect(result).toEqual(mockFormData);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/edit_form");
    });
  });

  describe("loadNrtmJson", () => {
    it("loads the tournament results in NRTM JSON format", async () => {
      const mockResults = { name: "Tourney", players: [] };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResults), { status: 200 }));

      const result = await api.loadNrtmJson(10, mockFetch);

      expect(result).toEqual(mockResults);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/save_json");
    });
  });

  describe("uploadToAbr", () => {
    it("posts the upload and returns the ABR code", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ abr_code: "abc123" }), { status: 200 }),
      );

      const result = await api.uploadToAbr(10);

      expect(result).toEqual({ abr_code: "abc123" });
      const { url, requestOptions, headers } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/upload_to_abr");
      expect(requestOptions?.method).toBe("POST");
      expect(headers["X-CSRF-Token"]).toBe("mock-csrf-token");
    });

    it("throws the server error when the upload fails", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Upload to Always Be Running failed." }), {
          status: 422,
        }),
      );

      await expect(api.uploadToAbr(10)).rejects.toThrow("Upload to Always Be Running failed.");
    });
  });

  describe("loadStage", () => {
    it("loads stage settings", async () => {
      const mockStage = {
        stage: { id: 1, tournament_id: 10, format: "Swiss" },
      };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockStage), { status: 200 }));

      const result = await api.loadStage(10, 1, mockFetch);

      expect(result).toEqual(mockStage);
      const { url } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/stages/1/settings");
    });
  });

  describe("createTournament", () => {
    it("posts new tournament data", async () => {
      const tournament = new Tournament({ name: "New Tourney" });
      const mockResponse = { id: 123, name: "New Tourney", url: "/tournaments/123" };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 201 }));

      const result = await api.createTournament(tournament);

      expect(result).toEqual(mockResponse);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments");
      expect(requestOptions?.method).toBe("POST");
      expect(body).toEqual({ tournament });
    });
  });

  describe("createDemoTournament", () => {
    const demoTournament: DemoTournamentSettings = {
      name: "Demo Tourney",
      swiss_format: "single_sided",
      num_players: 8,
      num_first_round_byes: 0,
      assign_ids: false,
    };
    const mockDemoResponse = {
      id: 123,
      name: "Demo Tourney",
      url: "/tournaments/123/rounds",
    };

    it("creates a demo tournament with tournament object and csrf token", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockDemoResponse), { status: 201 }),
      );

      const result = await api.createDemoTournament(demoTournament);

      expect(result).toEqual(mockDemoResponse);
      const { url, requestOptions, headers, body } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/create_demo");
      expect(requestOptions?.method).toBe("POST");
      expect(headers["X-CSRF-Token"]).toBe("mock-csrf-token");
      expect(body).toEqual({ tournament: demoTournament });
    });

    it("handles validation errors", async () => {
      const mockErrors = {
        errors: {
          name: ["Name is required"],
        },
      };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockErrors), { status: 422 }));

      await expect(api.createDemoTournament(demoTournament)).rejects.toThrow(ValidationError);
    });
  });

  describe("updateTournamentSettings", () => {
    it("patches tournament settings and returns true", async () => {
      const tournament = new Tournament({ id: 10, name: "Updated Tourney" });
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await api.updateTournamentSettings(tournament);

      expect(result).toBe(true);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10");
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
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const result = await api.saveStage(10, stage, mockFetch);

      expect(result).toEqual(mockResponse);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/api/classic/tournaments/10/stages/1");
      expect(requestOptions?.method).toBe("PATCH");
      expect(body).toEqual({ stage });
    });
  });
});
