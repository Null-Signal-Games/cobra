import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import { v1Api } from "#lib/api/v1.ts";
import { makeAuthUser, makeTournamentsResponse } from "#lib/testing/fixtures.ts";
import { authStore } from "#lib/utils/auth.svelte.ts";
import MyTournamentsPage from "./+page.svelte";

vi.mock("#lib/api/v1.ts", () => ({
  v1Api: { loadUserTournaments: vi.fn() },
}));
vi.mock("$app/env/public", () => ({ CLIENT_COBRA_API_ENDPOINT: "http://localhost:3000" }));

describe("My tournaments page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(authStore, "redirectToLogin").mockReturnValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("when signed in as a tournament organizer", () => {
    it("lists their tournaments, marking private ones", async () => {
      vi.mocked(v1Api.loadUserTournaments).mockResolvedValue(
        makeTournamentsResponse([{ name: "Public GNK" }, { name: "Secret GNK", private: true }]),
      );

      render(MyTournamentsPage, {
        props: {
          data: { user: makeAuthUser({ nrdb_username: "jo_z" }), tournamentTypes: [] },
          params: {}
        }
      });

      expect(await screen.findByRole("link", { name: "Public GNK" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Secret GNK" }).parentElement).toHaveTextContent(
        "Private",
      );
      expect(screen.getByText("jo_z")).toBeInTheDocument();
    });

    it("says when they have no tournaments", async () => {
      vi.mocked(v1Api.loadUserTournaments).mockResolvedValue(makeTournamentsResponse([]));

      render(MyTournamentsPage, {
        props: {
          data: { user: makeAuthUser({ nrdb_username: "jo_z" }), tournamentTypes: [] },
          params: {}
        }
      });

      expect(
        await screen.findByText("You haven't created any tournaments yet."),
      ).toBeInTheDocument();
    });
  });

  it("sends a signed out user to log in", async () => {
    vi.spyOn(authStore, "checkAuth").mockResolvedValue(null);

    render(MyTournamentsPage, {
      props: {
        data: { user: null, tournamentTypes: [] },
        params: {}
      }
    });

    await vi.waitFor(() => {
      expect(authStore.redirectToLogin).toHaveBeenCalled();
    });
    expect(v1Api.loadUserTournaments).not.toHaveBeenCalled();
  });
});
