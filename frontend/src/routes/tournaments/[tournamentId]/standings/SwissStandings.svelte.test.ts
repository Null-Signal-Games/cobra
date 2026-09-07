import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import SwissStandings from "./SwissStandings.svelte";
import type { SwissStage } from "$lib/model/Standings";

describe("SwissStandings", () => {
  afterEach(() => {
    cleanup();
  });

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
          name_with_pronouns: "Lia (she/her)",
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
        manual_seed: 4,
        side_bias: 0,
      },
      {
        position: 2,
        player: {
          id: 102,
          active: false,
          name_with_pronouns: "plural (he/him)",
          corp_id: { name: "Jinteki: PE", faction: "jinteki" },
          runner_id: { name: "Hoshiko", faction: "anarch" },
        },
        policy: { view_decks: false },
        points: 12,
        sos: "1.3333",
        extended_sos: "1.8889",
        bye_points: 3,
        corp_points: 6,
        runner_points: 3,
        manual_seed: 9,
        side_bias: null,
      },
    ],
  };

  it("renders round summary, player names, and point totals", () => {
    render(SwissStandings, {
      props: {
        stage: mockSwissStage,
        manual_seed: false,
      },
    });

    expect(screen.getByText("After 3 rounds")).toBeDefined();
    expect(screen.getByText("Lia (she/her)")).toBeDefined();
    expect(screen.getByText("plural (he/him)")).toBeDefined();
    expect(screen.getByText("18")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("1.6667")).toBeDefined();
    expect(screen.getByText("1.3333")).toBeDefined();
  });

  it("renders bye points when greater than 0", () => {
    render(SwissStandings, {
      props: {
        stage: mockSwissStage,
        manual_seed: false,
      },
    });

    expect(screen.getByText(/Bye \(3\)/)).toBeDefined();
  });

  it("shows dropped icon and tooltip for inactive players", async () => {
    render(SwissStandings, {
      props: {
        stage: mockSwissStage,
        manual_seed: false,
      },
    });

    // plural is dropped, so a tooltip trigger exists
    const tooltipTrigger = screen.getByRole("tooltip");
    expect(tooltipTrigger).toBeDefined();

    // Hover over the tooltip trigger
    await fireEvent.mouseEnter(tooltipTrigger);
    expect(screen.getByText("(dropped)")).toBeDefined();
  });

  it("renders seed column when manual_seed is enabled", () => {
    render(SwissStandings, {
      props: {
        stage: mockSwissStage,
        manual_seed: true,
      },
    });

    expect(screen.getByText("Seed")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
    expect(screen.getByText("9")).toBeDefined();
  });

  it("does not render seed column when manual_seed is false", () => {
    render(SwissStandings, {
      props: {
        stage: mockSwissStage,
        manual_seed: false,
      },
    });

    expect(screen.queryByText("Seed")).toBeNull();
  });

  it("renders side bias column for single_sided_swiss format", () => {
    const singleSidedStage: SwissStage = {
      ...mockSwissStage,
      format: "single_sided_swiss",
      standings: [
        {
          ...mockSwissStage.standings[0],
          side_bias: 2,
        },
        {
          ...mockSwissStage.standings[1],
          side_bias: -1,
        },
      ],
    };

    render(SwissStandings, {
      props: {
        stage: singleSidedStage,
        manual_seed: false,
      },
    });

    expect(screen.getByText("Side Bias")).toBeDefined();
    expect(screen.getByText("Corp +2")).toBeDefined();
    expect(screen.getByText("Runner +1")).toBeDefined();
  });

  it("does not render side bias column for double-sided swiss format", () => {
    const doubleSidedStage: SwissStage = {
      ...mockSwissStage,
      format: "swiss", // sadly swiss is double-sided swiss.
      standings: [
        {
          ...mockSwissStage.standings[0],
          side_bias: 2,
        },
        {
          ...mockSwissStage.standings[1],
          side_bias: -1,
        },
      ],
    };

    render(SwissStandings, {
      props: {
        stage: doubleSidedStage,
        manual_seed: false,
      },
    });

    expect(screen.queryByText("Side Bias")).toBeNull();
    expect(screen.queryByText("Corp +2")).toBeNull();
    expect(screen.queryByText("Runner +1")).toBeNull();
  });

  it("renders decks header and view decks button when viewable", () => {
    const decksViewableStage: SwissStage = {
      ...mockSwissStage,
      any_decks_viewable: true,
      standings: [
        {
          ...mockSwissStage.standings[0],
          policy: { view_decks: true },
        },
        {
          ...mockSwissStage.standings[1],
          policy: { view_decks: false },
        },
      ],
    };

    render(SwissStandings, {
      props: {
        stage: decksViewableStage,
        manual_seed: false,
      },
    });

    expect(screen.getByText("Decks")).toBeDefined();
    const viewDecksLinks = screen.getAllByText(/View decks/);
    expect(viewDecksLinks.length).toBe(1);
  });
});
