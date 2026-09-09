import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  changePlayerSide,
  reportScore,
  resetReports,
} from "./api_helper";
import type { ScoreReport } from "$lib/model/ScoreReport";

describe("tournament api_helper score reporting", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("changePlayerSide", () => {
    it("sends POST request with side data", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await changePlayerSide(10, 2, 42, "corp", mockFetch);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/beta/tournaments/10/rounds/2/pairings/42/report");
      expect(options.method).toBe("POST");
      expect(options.credentials).toBe("include");
      expect(JSON.parse(options.body)).toEqual({ side: "player1_is_corp" });
    });

    it("returns false when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await changePlayerSide(10, 2, 42, "corp", mockFetch);

      expect(result).toBe(false);
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
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/beta/tournaments/10/rounds/2/pairings/42/report");
      expect(options.method).toBe("POST");
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.self_report).toBe(true);
      expect(parsedBody.pairing).toEqual({
        score1: 3,
        score2: 0,
        score1_corp: 3,
        score2_runner: 0,
        score1_runner: 0,
        score2_corp: 0,
        intentional_draw: false,
      });
      expect(parsedBody.pairing.label).toBeUndefined();
      expect(parsedBody.pairing.extra_self_report_label).toBeUndefined();
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
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain(
        "/beta/tournaments/10/rounds/2/pairings/42/reset_self_report",
      );
      expect(options.method).toBe("DELETE");
      expect(options.credentials).toBe("include");
    });

    it("sends explicit csrf token in headers", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const result = await resetReports(10, 2, 42, "explicit-csrf-token", mockFetch);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).not.toContain("//beta");
      expect(options.headers["X-CSRF-Token"]).toBe("explicit-csrf-token");
    });
  });

  describe("csrf token and URL formatting", () => {
    it("uses explicit csrf token when provided to reportScore", async () => {
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

      await reportScore(10, 2, 42, report, true, "test-csrf-token", mockFetch);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).not.toContain("//beta");
      expect(options.headers["X-CSRF-Token"]).toBe("test-csrf-token");
    });

    it("uses explicit csrf token when provided to changePlayerSide", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      await changePlayerSide(10, 2, 42, "runner", "test-side-token", mockFetch);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).not.toContain("//beta");
      expect(options.headers["X-CSRF-Token"]).toBe("test-side-token");
    });
  });
});
