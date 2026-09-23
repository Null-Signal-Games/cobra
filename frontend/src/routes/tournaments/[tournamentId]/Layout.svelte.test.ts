import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/svelte";
import TournamentLayout from "./+layout.svelte";
import { Tournament } from "$lib/model/Tournament";
import { createRawSnippet } from "svelte";

vi.mock("$app/env/public", () => ({
  COBRA_API_SERVER: "http://localhost:3000",
}));

describe("Tournament navigation tab strip", () => {

  afterEach(() => {
    cleanup();
  });

  const emptyChildren = createRawSnippet(() => ({
    render: () => "<div>Fake Container Content</div>",
  }));

  function renderLayout(tournament: Tournament) {
    return render(TournamentLayout, {
      props: {
        data: {
          tournamentTypes: [],
          tournamentData: {
            tournament,
            csrf_token: "",
          },
          timer: { show: false, started: false, running: false, paused: false, state: {
            started: false,
            paused: false
          } },
          player: null,
        },
        children: emptyChildren,
      },
    });
  }
  describe("when tournament has no elimination stage", () => {
    it("does not display the Bracket tab", () => {
      renderLayout(new Tournament({ id: 1, has_elimination_stage: false }));
      expect(screen.queryByRole("link", { name: "Bracket" })).not.toBeInTheDocument();
    });
  });
  describe("when tournament has an elimination stage", () => {
    it("displays the Bracket tab", () => {
      renderLayout(new Tournament({ id: 1, has_elimination_stage: true }));
      expect(screen.getByRole("link", { name: "Bracket" })).toBeInTheDocument();
    });
  });
});
