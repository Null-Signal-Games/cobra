import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import DoubleElimStandings from "./DoubleElimStandings.svelte";
import type { CutStage } from "$lib/model/Standings";

describe("DoubleElimStandings", () => {
  afterEach(() => {
    cleanup();
  });

  const mockCutStage: CutStage = {
    format: "double_elim",
    rounds_complete: 4,
    any_decks_viewable: false,
    standings: [
      {
        position: 1,
        seed: 3,
        player: {
          id: 201,
          active: true,
          name_with_pronouns: "wiggles (he/him)",
          corp_id: { name: "Ob Superheavy Logistics", faction: "weyland" },
          runner_id: { name: "Lat", faction: "shaper" },
        },
        policy: { view_decks: false },
      },
      {
        position: 2,
        seed: 1,
        player: null, // Unknown / unfinalized position
        policy: { view_decks: false },
      },
    ],
  };

  it("renders rank, player name, seed, and identities", () => {
    render(DoubleElimStandings, {
      props: {
        stage: mockCutStage,
      },
    });

    expect(screen.getByText("Rank")).toBeDefined();
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Seed")).toBeDefined();
    expect(screen.getByText("wiggles (he/him)")).toBeDefined();
    expect(screen.getByText("Ob Superheavy Logistics")).toBeDefined();
    expect(screen.getByText("Lat")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("renders placeholder '???' when player is null", () => {
    render(DoubleElimStandings, {
      props: {
        stage: mockCutStage,
      },
    });

    const placeholders = screen.getAllByText("???");
    // Should render ??? for name, corp, runner, and seed
    expect(placeholders.length).toBeGreaterThanOrEqual(4);
  });

  it("does not render decks column when any_decks_viewable is false", () => {
    render(DoubleElimStandings, {
      props: {
        stage: mockCutStage,
      },
    });

    expect(screen.queryByText("Decks")).toBeNull();
  });

  it("renders decks header and view decks button when viewable", () => {
    const decksViewableStage: CutStage = {
      ...mockCutStage,
      any_decks_viewable: true,
      standings: [
        {
          ...mockCutStage.standings[0],
          policy: { view_decks: true },
        },
        {
          ...mockCutStage.standings[1],
          policy: { view_decks: false },
        },
      ],
    };

    render(DoubleElimStandings, {
      props: {
        stage: decksViewableStage,
      },
    });

    expect(screen.getByText("Decks")).toBeDefined();
    const viewDecksButtons = screen.getAllByText(/View decks/);
    expect(viewDecksButtons.length).toBe(1);
  });
});
