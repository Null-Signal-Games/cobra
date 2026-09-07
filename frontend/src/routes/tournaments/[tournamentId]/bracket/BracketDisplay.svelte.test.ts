import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import BracketDisplay from "./BracketDisplay.svelte";
import type { BracketStage } from "$lib/model/Bracket";

describe("BracketDisplay", () => {
  afterEach(() => {
    cleanup();
  });

  const mockDoubleElimStage: BracketStage = {
    name: "Top 4 Double Elimination",
    format: "double_elim",
    is_single_sided: true,
    is_elimination: true,
    player_count: 4,
    rounds: [
      {
        id: null,
        number: 1,
        pairings: [
          {
            id: null,
            table_number: 1,
            round: 1,
            winner_game: 3,
            loser_game: 4,
            bracket_type: "upper",
            score_label: "2-0 (C)",
            player1: {
              id: 1,
              name_with_pronouns: "evie (she/her)",
              seed: 1,
              side: "corp",
              user_id: "1",
              side_label: "Corp",
              corp_id: { name: "Near-Earth Hub", faction: "nbn" },
              runner_id: { name: "Arissana", faction: "shaper" },
            },
            player2: {
              id: 4,
              name_with_pronouns: "spiderbro (he/him)",
              seed: 4,
              side: "runner",
              user_id: "4",
              side_label: "Runner",
              corp_id: { name: "Jinteki PE", faction: "jinteki" },
              runner_id: { name: "Hoshiko", faction: "anarch" },
            },
          },
          {
            id: null,
            table_number: 2,
            round: 1,
            winner_game: 3,
            loser_game: 4,
            bracket_type: "upper",
            score_label: "0-2 (R)",
            player1: {
              id: 2,
              name_with_pronouns: "wiggles (he/him)",
              seed: 2,
              side: "corp",
              user_id: "2",
              side_label: "Corp",
              corp_id: { name: "Sportsmetal", faction: "haas-bioroid" },
              runner_id: { name: "Steve", faction: "criminal" },
            },
            player2: {
              id: 3,
              name_with_pronouns: "locks (they/them)",
              seed: 3,
              side: "runner",
              user_id: "3",
              side_label: "Runner",
              corp_id: { name: "Ob Superheavy", faction: "weyland" },
              runner_id: { name: "Lat", faction: "shaper" },
            },
          },
          {
            id: null,
            table_number: 4,
            round: 1,
            winner_game: 5,
            loser_game: null,
            bracket_type: "lower",
            player1_seed: 4,
            player2_seed: 2,
          },
        ],
      },
      {
        id: null,
        number: 2,
        pairings: [
          {
            id: null,
            table_number: 3,
            round: 2,
            winner_game: 6,
            loser_game: 5,
            bracket_type: "upper",
            score_label: undefined,
            player1: undefined,
            player2: undefined,
          },
          {
            id: null,
            table_number: 5,
            round: 2,
            winner_game: 6,
            loser_game: null,
            bracket_type: "lower",
            score_label: undefined,
            player1: undefined,
            player2: undefined,
          },
        ],
      },
      {
        id: null,
        number: 3,
        pairings: [
          {
            id: null,
            table_number: 6,
            round: 3,
            winner_game: null,
            loser_game: null,
            bracket_type: "upper",
            player1: {
              id: 1,
              name_with_pronouns: "evie (she/her)",
              seed: 1,
              side: "corp",
              user_id: "1",
              side_label: "Corp",
              corp_id: { name: "Near-Earth Hub", faction: "nbn" },
              runner_id: { name: "Arissana", faction: "shaper" },
            },
          },
        ],
      },
    ],
  };

  it("renders an SVG bracket container with role='img'", () => {
    render(BracketDisplay, {
      props: {
        stage: mockDoubleElimStage,
      },
    });

    const svg = screen.getByRole("img", { name: "Bracket" });
    expect(svg).toBeDefined();
  });

  it("renders player names for first round matches", () => {
    render(BracketDisplay, {
      props: {
        stage: mockDoubleElimStage,
      },
    });

    expect(screen.getAllByText("evie (she/her)").length).toBeGreaterThan(0);
    expect(screen.getByText("spiderbro (he/him)")).toBeDefined();
    expect(screen.getByText("wiggles (he/him)")).toBeDefined();
    expect(screen.getAllByText("locks (they/them)").length).toBeGreaterThan(0);
  });

  it("propagates previous game winners to next round match placeholders", () => {
    render(BracketDisplay, {
      props: {
        stage: mockDoubleElimStage,
      },
    });

    // evie won table 1 (C), locks won table 2 (R)
    // Table 3 has predecessorMap pointing to table 1 & 2 winners, so it displays evie & locks
    const evieOccurrences = screen.getAllByText("evie (she/her)");
    const locksOccurrences = screen.getAllByText("locks (they/them)");

    expect(evieOccurrences.length).toBeGreaterThanOrEqual(2);
    expect(locksOccurrences.length).toBeGreaterThanOrEqual(2);
  });

  it("renders double elimination lower bracket matches and seeds", () => {
    render(BracketDisplay, {
      props: {
        stage: mockDoubleElimStage,
      },
    });

    expect(screen.getByText("New 4 seed")).toBeDefined();
    expect(screen.getByText("New 2 seed")).toBeDefined();
  });
});
