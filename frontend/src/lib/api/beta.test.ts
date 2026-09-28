import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  changePlayerSide,
  deleteStage,
  deleteTournament,
  loadPlayer,
  loadPlayerByUserId,
  reportScore,
  resetReports,
  savePlayer,
} from "./beta";
import { Player } from "$lib/model/Player";
import type { ScoreReport } from "$lib/model/ScoreReport";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
import * as csrfModule from "$lib/csrf";

describe("tournament score reporting", () => {
  const mockFetch = vi.fn<typeof fetch>();

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
    vi.spyOn(csrfModule, "csrfToken").mockReturnValue("mock-csrf-token");
  });

  describe("changePlayerSide", () => {
    it("sends POST request with side data", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await changePlayerSide(10, 2, 42, "corp", mockFetch);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/beta/tournaments/10/rounds/2/pairings/42/report");
      expect(requestOptions?.method).toBe("POST");
      expect(requestOptions?.credentials).toBe("include");
      expect(body).toEqual({ side: "player1_is_corp" });
    });

    it("returns false when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await changePlayerSide(10, 2, 42, "corp", mockFetch);

      expect(result).toBe(false);
    });
  });

  describe("csrf token and URL formatting", () => {
    it("automatically injects csrf token into mutating requests", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const report: ScoreReport = {
        score1: 3,
        score2: 0,
        score1_corp: 3,
        score2_runner: 0,
        score1_runner: 0,
        score2_corp: 0,
        intentional_draw: false,
      };

      await reportScore(10, 2, 42, report, true, mockFetch);

      const { url, headers } = getFetchCall();
      expect(url).not.toContain("//beta");
      expect(headers["X-CSRF-Token"]).toBe("mock-csrf-token");
    });
  });

  describe("reportScore", () => {
    it("strips UI labels and sends POST with pairing and self_report", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const report: ScoreReport = {
        score1: 3,
        score2: 0,
        score1_corp: 3,
        score2_runner: 0,
        score1_runner: 0,
        score2_corp: 0,
        intentional_draw: false,
        label: "3-0",
        extra_self_report_label: "Player 1 wins",
      };

      const result = await reportScore(10, 2, 42, report, true, mockFetch);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/beta/tournaments/10/rounds/2/pairings/42/report");
      expect(requestOptions?.method).toBe("POST");
      expect(body.self_report).toBe(true);
      expect(body.pairing).toEqual({
        score1: 3,
        score2: 0,
        score1_corp: 3,
        score2_runner: 0,
        score1_runner: 0,
        score2_corp: 0,
        intentional_draw: false,
      });
      const pairing = body.pairing as Record<string, unknown>;
      expect(pairing.label).toBeUndefined();
      expect(pairing.extra_self_report_label).toBeUndefined();
    });

    it("returns false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failed"));

      const report: ScoreReport = {
        score1: 3,
        score2: 0,
        score1_corp: 3,
        score2_runner: 0,
        score1_runner: 0,
        score2_corp: 0,
        intentional_draw: false,
      };

      const result = await reportScore(10, 2, 42, report, false, mockFetch);

      expect(result).toBe(false);
    });
  });

  describe("resetReports", () => {
    it("sends DELETE request to reset_self_report endpoint", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await resetReports(10, 2, 42, mockFetch);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions } = getFetchCall();
      expect(url).toContain("/beta/tournaments/10/rounds/2/pairings/42/reset_self_report");
      expect(requestOptions?.method).toBe("DELETE");
      expect(requestOptions?.credentials).toBe("include");
    });
  });

  describe("deleteTournament", () => {
    it("makes a DELETE request to /beta/tournaments/:id with confirmation_name and returns true on 200", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await deleteTournament(42, "Danger Noodle", mockFetch);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions, headers } = getFetchCall();
      expect(url).toContain("/beta/tournaments/42");
      expect(requestOptions?.method).toBe("DELETE");
      expect(requestOptions?.credentials).toBe("include");
      expect(headers["X-CSRF-Token"]).toBe("mock-csrf-token");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(requestOptions?.body).toBe(JSON.stringify({ confirmation_name: "Danger Noodle" }));
    });

    it("returns false and logs server error message on 422", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "Confirmation name does not match the tournament name" }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      );

      const result = await deleteTournament(42, "Wrong Name", mockFetch);
      expect(result).toBe(false);
      expect(globalMessages.errors).toContain(
        "Confirmation name does not match the tournament name",
      );
    });

    it("returns false and logs fallback error on failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await deleteTournament(42, "Danger Noodle", mockFetch);
      expect(result).toBe(false);
      expect(globalMessages.errors).toContain("Failed to delete tournament.");
    });

    it("returns false and logs error on network exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failed"));

      const result = await deleteTournament(42, "Danger Noodle", mockFetch);
      expect(result).toBe(false);
      expect(globalMessages.errors).toContain("Failed to delete tournament: Network failed");
    });
  });

  describe("deleteStage", () => {
    it("makes a DELETE request to /beta/tournaments/:tournamentId/stages/:stageId with confirmation_name and returns true on 200", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await deleteStage(42, 7, "Danger Noodle", mockFetch);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions, headers } = getFetchCall();
      expect(url).toContain("/beta/tournaments/42/stages/7");
      expect(requestOptions?.method).toBe("DELETE");
      expect(requestOptions?.credentials).toBe("include");
      expect(headers["X-CSRF-Token"]).toBe("mock-csrf-token");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(requestOptions?.body).toBe(JSON.stringify({ confirmation_name: "Danger Noodle" }));
    });

    it("returns false and logs server error message on 422", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "Confirmation name does not match the tournament name" }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      );

      const result = await deleteStage(42, 7, "Wrong Name", mockFetch);
      expect(result).toBe(false);
      expect(globalMessages.errors).toContain(
        "Confirmation name does not match the tournament name",
      );
    });

    it("returns false and logs fallback error on failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await deleteStage(42, 7, "Danger Noodle", mockFetch);
      expect(result).toBe(false);
      expect(globalMessages.errors).toContain("Failed to delete stage.");
    });

    it("returns false and logs error on network exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Stage deletion network failed"));

      const result = await deleteStage(42, 7, "Danger Noodle", mockFetch);
      expect(result).toBe(false);
      expect(globalMessages.errors).toContain(
        "Failed to delete stage: Stage deletion network failed",
      );
    });
  });

  describe("savePlayer", () => {
    it("creates a new player with POST when player id is 0", async () => {
      const savedPlayer = new Player();
      savedPlayer.id = 123;
      savedPlayer.name = "Alice";
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ player: savedPlayer }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const newPlayer = new Player();
      newPlayer.name = "Alice";
      const result = await savePlayer(42, newPlayer, false, mockFetch);

      expect(result.id).toBe(123);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions } = getFetchCall();
      expect(url).toContain("/beta/tournaments/42/players");
      expect(requestOptions?.method).toBe("POST");
      expect(requestOptions?.credentials).toBe("include");
    });

    it("updates an existing player with PATCH when player id is non-zero", async () => {
      const updatedPlayer = new Player();
      updatedPlayer.id = 123;
      updatedPlayer.name = "Alice Updated";
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ player: updatedPlayer }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const player = new Player();
      player.id = 123;
      player.name = "Alice Updated";
      const result = await savePlayer(42, player, true, mockFetch);

      expect(result.name).toBe("Alice Updated");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions, body } = getFetchCall();
      expect(url).toContain("/beta/tournaments/42/players/123");
      expect(requestOptions?.method).toBe("PATCH");
      expect(body).toMatchObject({ organiser_view: true });
    });

    it("captures errors from response when present", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ player: null, errors: ["Name already taken"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const player = new Player();
      player.name = "Duplicate";
      await savePlayer(42, player, false, mockFetch);

      expect(globalMessages.errors).toContain("Name already taken");
    });
  });

  describe("loadPlayer", () => {
    it("fetches player data from /beta/tournaments/:tournamentId/players/:playerId", async () => {
      const mockPlayer = { id: 5, name: "Alice" };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockPlayer), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await loadPlayer(42, 5, mockFetch);

      expect(result).toEqual(mockPlayer);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions } = getFetchCall();
      expect(url).toContain("/beta/tournaments/42/players/5");
      expect(requestOptions?.method).toBe("GET");
    });
  });

  describe("loadPlayerByUserId", () => {
    it("fetches player data from /beta/tournaments/:tournamentId/players/by_user_id/:userId", async () => {
      const mockPlayer = { id: 5, user_id: 10, name: "Alice" };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockPlayer), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await loadPlayerByUserId(42, 10, mockFetch);

      expect(result).toEqual(mockPlayer);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const { url, requestOptions } = getFetchCall();
      expect(url).toContain("/beta/tournaments/42/players/by_user_id/10");
      expect(requestOptions?.method).toBe("GET");
    });
  });
});

