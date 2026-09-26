import { describe, it, expect, vi, beforeEach } from "vitest";
import { changePlayerSide, reportScore } from "./beta";
import type { ScoreReport } from "$lib/model/ScoreReport";

describe("tournament api_helper score reporting", () => {
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

      const { url, headers } = getFetchCall();
      expect(url).not.toContain("//beta");
      expect(headers["X-CSRF-Token"]).toBe("test-csrf-token");
    });

    it("uses explicit csrf token when provided to changePlayerSide", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      await changePlayerSide(10, 2, 42, "runner", "test-side-token", mockFetch);

      const { url, headers } = getFetchCall();
      expect(url).not.toContain("//beta");
      expect(headers["X-CSRF-Token"]).toBe("test-side-token");
    });
  });

});
