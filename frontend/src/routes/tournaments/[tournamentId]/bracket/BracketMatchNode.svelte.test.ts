import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import BracketMatchNode from "./BracketMatchNode.svelte";
import type { BracketPairing } from "$lib/model/Bracket";

describe("BracketMatchNode", () => {
  afterEach(() => {
    cleanup();
  });

  const mockPairing: BracketPairing = {
    id: null,
    table_number: 1,
    round: 1,
    winner_game: 3,
    loser_game: null,
    bracket_type: "upper",
    score_label: "2-0 (C)",
    player1: {
      id: 10,
      name_with_pronouns: "evie (she/her)",
      seed: 1,
      side: "corp",
      user_id: "10",
      side_label: "Corp",
      corp_id: { name: "Near-Earth Hub", faction: "nbn" },
      runner_id: { name: "Arissana", faction: "shaper" },
    },
    player2: {
      id: 20,
      name_with_pronouns: "sindarin (he/him)",
      seed: 2,
      side: "runner",
      user_id: "20",
      side_label: "Runner",
      corp_id: { name: "Sportsmetal", faction: "haas-bioroid" },
      runner_id: { name: "Steve", faction: "criminal" },
    },
  };

  it("renders table number and player names", () => {
    render(BracketMatchNode, {
      props: {
        match: mockPairing,
        allMatches: [mockPairing],
        predecessorMap: {},
        isSingleElim: false,
        x: 0,
        y: 0,
        width: 200,
        height: 80,
      },
    });

    expect(screen.getByText("1")).toBeDefined(); // Table number
    expect(screen.getByText("evie (she/her)")).toBeDefined();
    expect(screen.getByText("sindarin (he/him)")).toBeDefined();
  });

  it("renders winner and loser styling based on score_label", () => {
    const { container } = render(BracketMatchNode, {
      props: {
        match: mockPairing, // score_label: "2-0 (C)" -> evie (corp) is winner, sindarin (runner) is loser
        allMatches: [mockPairing],
        predecessorMap: {},
        isSingleElim: false,
        x: 0,
        y: 0,
        width: 200,
        height: 80,
      },
    });

    const winnerDiv = container.querySelector(".winner");
    const loserDiv = container.querySelector(".loser");

    expect(winnerDiv).not.toBeNull();
    expect(loserDiv).not.toBeNull();
    expect(winnerDiv?.textContent).toContain("evie (she/her)");
    expect(loserDiv?.textContent).toContain("sindarin (he/him)");
  });

  it("renders seed label in single elimination mode", () => {
    render(BracketMatchNode, {
      props: {
        match: mockPairing,
        allMatches: [mockPairing],
        predecessorMap: {},
        isSingleElim: true,
        x: 0,
        y: 0,
        width: 200,
        height: 80,
      },
    });

    expect(screen.getByText("1", { selector: "span.seed-label" })).toBeDefined();
    expect(screen.getByText("2", { selector: "span.seed-label" })).toBeDefined();
  });

  it("renders fallback text when players are unpopulated", () => {
    const unpopulatedMatch: BracketPairing = {
      id: null,
      table_number: 5,
      round: 2,
      winner_game: null,
      loser_game: null,
      bracket_type: "upper",
      player1_seed: 4,
    };

    render(BracketMatchNode, {
      props: {
        match: unpopulatedMatch,
        allMatches: [unpopulatedMatch],
        predecessorMap: {
          5: [{ method: "winner", game: 1 }, { method: "loser", game: 2 }],
        },
        isSingleElim: false,
        x: 0,
        y: 0,
        width: 200,
        height: 80,
      },
    });

    // Top player has seed 4
    expect(screen.getByText("New 4 seed")).toBeDefined();
    // Bottom player fallback text
    expect(screen.getByText("Loser of 2")).toBeDefined();
  });
});
