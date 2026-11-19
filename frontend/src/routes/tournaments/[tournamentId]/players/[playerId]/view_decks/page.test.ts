import { beforeEach, describe, expect, it, vi } from "vitest";
import { betaApi } from "#lib/api/beta.ts";
import { v1Api } from "#lib/api/v1.ts";
import { Player } from "#lib/model/Player.ts";
import { load } from "./+page.ts";

vi.mock("#lib/api/beta.ts", () => ({
  betaApi: {
    loadPlayer: vi.fn(),
    loadDecks: vi.fn(),
  },
}));
vi.mock("#lib/api/v1.ts", () => ({
  v1Api: {
    loadPlayer: vi.fn(),
  },
}));

describe("view_decks load", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads the player from the public API. Viewers who are not the player or TO can see decks", async () => {
    const player = new Player();
    player.name = "plural";
    vi.mocked(v1Api.loadPlayer).mockResolvedValue(player);
    vi.mocked(betaApi.loadDecks).mockResolvedValue([]);
    const fetch = vi.fn<typeof globalThis.fetch>();

    const result = await load({ params: { tournamentId: "5132", playerId: "60436" }, fetch } as never);

    expect(v1Api.loadPlayer).toHaveBeenCalledWith(5132, 60436, fetch);
    expect(betaApi.loadDecks).toHaveBeenCalledWith(5132, 60436, fetch);
    expect(result).toMatchObject({ playerName: "plural" });
  });
});
