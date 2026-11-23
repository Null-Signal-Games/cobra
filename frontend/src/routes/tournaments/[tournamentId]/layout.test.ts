import { beforeEach, describe, expect, it, vi } from "vitest";
import { betaApi } from "#lib/api/beta.ts";
import { v1Api } from "#lib/api/v1.ts";
import { makeAuthUser, makePlayer, makeRoundTimer, makeTournament } from "#lib/testing/fixtures.ts";
import { makeLoadEvent } from "#lib/testing/loaders.ts";
import { load } from "./+layout.ts";

vi.mock("#lib/api/beta.ts", () => ({
  betaApi: { loadCurrentRoundTimer: vi.fn() },
}));
vi.mock("#lib/api/v1.ts", () => ({
  v1Api: { loadTournament: vi.fn(), loadPlayerByUserId: vi.fn() },
}));

describe("tournament layout load", () => {
  const tournament = makeTournament({ id: 7 });
  const timer = makeRoundTimer();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(v1Api.loadTournament).mockResolvedValue({ tournament });
    vi.mocked(betaApi.loadCurrentRoundTimer).mockResolvedValue(timer);
  });

  it("loads the tournament, timer and the signed-in player's registration", async () => {
    const player = makePlayer();
    vi.mocked(v1Api.loadPlayerByUserId).mockResolvedValue(player);
    const fetch = vi.fn<typeof globalThis.fetch>();

    const result = await load(
      makeLoadEvent({
        params: { tournamentId: "7" },
        parentData: { user: makeAuthUser({ id: 3 }) },
        fetch,
      }),
    );

    expect(v1Api.loadTournament).toHaveBeenCalledWith(7, fetch);
    expect(betaApi.loadCurrentRoundTimer).toHaveBeenCalledWith(7, fetch);
    expect(v1Api.loadPlayerByUserId).toHaveBeenCalledWith(7, 3, fetch);
    expect(result).toEqual({ tournamentData: { tournament }, timer, player });
  });

  it("has no player for a signed out user", async () => {
    const result = await load(
      makeLoadEvent({ params: { tournamentId: "7" }, parentData: { user: null } }),
    );

    expect(v1Api.loadPlayerByUserId).not.toHaveBeenCalled();
    expect(result).toMatchObject({ player: null });
  });

  // e.g. a private tournament, which the API reports as not found.
  it("fails when the tournament can't be loaded", async () => {
    vi.mocked(v1Api.loadTournament).mockRejectedValue(new Error("Specified Record Not Found"));

    await expect(
      load(makeLoadEvent({ params: { tournamentId: "7" }, parentData: { user: null } })),
    ).rejects.toThrow("Specified Record Not Found");
  });
});
