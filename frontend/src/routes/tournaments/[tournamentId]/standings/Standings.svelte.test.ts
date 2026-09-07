import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import StandingsPage from "./+page.svelte";
import type { CutStage, StandingsData, SwissStage } from "$lib/model/Standings";

describe("Standings Page Container", () => {
  afterEach(() => {
    cleanup();
  });

  // The stages here are artificial in the sense that they don't have the same players in both stages (just to keep things tidy).
  const mockSwissStage: SwissStage = {
    format: "swiss",
    rounds_complete: 3,
    any_decks_viewable: false,
    standings: [
      {
        position: 1,
        player: {
          id: 101,
          active: true,
          name_with_pronouns: "plural (he/him)",
          corp_id: { name: "Near-Earth Hub", faction: "nbn" },
          runner_id: { name: "Arissana", faction: "shaper" },
        },
        policy: { view_decks: false },
        points: 18,
        sos: "1.6667",
        extended_sos: "2.1111",
        bye_points: 0,
        corp_points: 9,
        runner_points: 9,
        manual_seed: null,
        side_bias: 0,
      },
    ],
  };

  const mockCutStage: CutStage = {
    format: "double_elim",
    rounds_complete: 2,
    any_decks_viewable: false,
    standings: [
      {
        position: 1,
        seed: 1,
        player: {
          id: 201,
          active: true,
          name_with_pronouns: "Lia (she/her)",
          corp_id: { name: "Ob Superheavy Logistics", faction: "weyland" },
          runner_id: { name: "Lat", faction: "shaper" },
        },
        policy: { view_decks: false },
      },
    ],
  };

  it("renders the Standings heading", () => {
    const data: { standings: StandingsData } = {
      standings: {
        manual_seed: false,
        stages: [],
      },
    };

    render(StandingsPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    const heading = screen.getByRole("heading", { level: 2, name: "Standings" });
    expect(heading).toBeDefined();
  });

  it("renders SwissStandings when a swiss stage is present", () => {
    const data: { standings: StandingsData } = {
      standings: {
        manual_seed: false,
        stages: [mockSwissStage],
      },
    };

    render(StandingsPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    expect(screen.getByText("After 3 rounds")).toBeDefined();
    expect(screen.getByText("plural (he/him)")).toBeDefined();
  });

  it("renders DoubleElimStandings when an elimination stage is present", () => {
    const data: { standings: StandingsData } = {
      standings: {
        manual_seed: false,
        stages: [mockCutStage],
      },
    };

    render(StandingsPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    expect(screen.getByText("Lia (she/her)")).toBeDefined();
    expect(screen.getByText("Ob Superheavy Logistics")).toBeDefined();
  });

  it("renders both Swiss and DoubleElim stages when both exist", () => {
    const data: { standings: StandingsData } = {
      standings: {
        manual_seed: false,
        stages: [mockCutStage, mockSwissStage],
      },
    };

    render(StandingsPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    // Swiss content
    expect(screen.getByText("After 3 rounds")).toBeDefined();
    expect(screen.getByText("plural (he/him)")).toBeDefined();

    // Cut content
    expect(screen.getByText("Lia (she/her)")).toBeDefined();
  });
});
