import { beforeEach, describe, expect, it, vi } from "vitest";
import { v1Api } from "#lib/api/v1.ts";
import { makeTournamentsResponse } from "#lib/testing/fixtures.ts";
import { expectRedirect, makeLoadEvent } from "#lib/testing/loaders.ts";
import { load } from "./+page.ts";

vi.mock("#lib/api/v1.ts", () => ({
  v1Api: {
    loadTournamentBySlug: vi.fn(),
  },
}));

describe("[slug] shortcode load", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("looks up the shortcode and redirects to the matching tournament", async () => {
    vi.mocked(v1Api.loadTournamentBySlug).mockResolvedValue(makeTournamentsResponse([{ id: 42 }]));
    const fetch = vi.fn<typeof globalThis.fetch>();

    await expectRedirect(
      load(makeLoadEvent({ params: { slug: "ABCD" }, fetch })),
      302,
      "/tournaments/42",
    );

    expect(v1Api.loadTournamentBySlug).toHaveBeenCalledWith("ABCD", fetch);
  });

  it("redirects to the not found page when nothing matches", async () => {
    vi.mocked(v1Api.loadTournamentBySlug).mockResolvedValue(makeTournamentsResponse([]));

    await expectRedirect(
      load(makeLoadEvent({ params: { slug: "NOSUCH" } })),
      302,
      "/tournaments/not_found?code=NOSUCH",
    );
  });
});
