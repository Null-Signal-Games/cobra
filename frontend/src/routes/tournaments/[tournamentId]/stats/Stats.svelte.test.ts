import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import StatsPage from "./+page.svelte";
import type { Stage } from "$lib/model/Stage";
import type { CutStats, Stats } from "$lib/model/Stats";

describe("Stats Page Container", () => {
  afterEach(() => {
    cleanup();
  });

  function mockRound(id: number, number: number) {
    return {
      id,
      number,
      completed: true,
      pairings: [],
      pairings_reported: 0,
      length_minutes: 65,
      timer: {
        show: false,
        running: false,
        paused: false,
        started: false,
        state: { started: false, paused: false },
      },
    };
  }

  const mockSwissStage: Stage = {
    id: 1,
    name: "Swiss Stage",
    format: "swiss",
    is_single_sided: false,
    is_elimination: false,
    view_decks: false,
    rounds: [mockRound(1, 1)],
  };

  const mockElimStage: Stage = {
    id: 2,
    name: "Top 4 Double Elimination",
    format: "double_elim",
    is_single_sided: true,
    is_elimination: true,
    view_decks: false,
    rounds: [mockRound(2, 1)],
  };

  const mockStats: Stats = {
    swiss: {
      num_players: 5,
      corp: {
        ids: [
          { identity: { name: "Editorial Division: Ad Nihilum", faction: "nbn" }, count: 2 },
          { identity: { name: "A Teia: IP Recovery", faction: "jinteki" }, count: 1 },
          { identity: { name: "MirrorMorph: Endless Iteration", faction: "haas-bioroid" }, count: 1 },
          { identity: { name: "Thunderbolt Armaments: Peace Through Power", faction: "haas-bioroid" }, count: 1 },
        ],
        factions: [
          { name: "nbn", count: 2 },
          { name: "haas-bioroid", count: 2 },
          { name: "jinteki", count: 1 },
        ],
      },
      runner: {
        ids: [
          { identity: { name: "Barry “Baz” Wong: Tri-Maf Veteran", faction: "criminal" }, count: 2 },
          { identity: { name: "Esâ Afontov: Eco-Insurrectionist", faction: "anarch" }, count: 2 },
          { identity: { name: "Dewi Subrotoputri: Pedagogical Dhalang", faction: "shaper" }, count: 1 },
        ],
        factions: [
          { name: "anarch", count: 2 },
          { name: "criminal", count: 2 },
          { name: "shaper", count: 1 },
        ],
      },
    },
    elim: {
      num_players: 3,
      corp: {
        ids: [
          { identity: { name: "Editorial Division: Ad Nihilum", faction: "nbn" }, count: 1 },
          { identity: { name: "MirrorMorph: Endless Iteration", faction: "haas-bioroid" }, count: 1 },
          { identity: { name: "Thunderbolt Armaments: Peace Through Power", faction: "haas-bioroid" }, count: 1 },
        ],
        factions: [
          { name: "haas-bioroid", count: 2 },
          { name: "nbn", count: 1 },
        ],
      },
      runner: {
        ids: [
          { identity: { name: "Esâ Afontov: Eco-Insurrectionist", faction: "anarch" }, count: 2 },
          { identity: { name: "Dewi Subrotoputri: Pedagogical Dhalang", faction: "shaper" }, count: 1 },
        ],
        factions: [
          { name: "anarch", count: 2 },
          { name: "shaper", count: 1 },
        ],
      },
    },
  };

  const mockCutStats: CutStats = {
    corp: {
      ids: [
        { identity: { name: "MirrorMorph: Endless Iteration", faction: "haas-bioroid" }, numSwissPlayers: 1, numCutPlayers: 1, cutConversion: 100.0 },
        { identity: { name: "Thunderbolt Armaments: Peace Through Power", faction: "haas-bioroid" }, numSwissPlayers: 1, numCutPlayers: 1, cutConversion: 100.0 },
        { identity: { name: "Editorial Division: Ad Nihilum", faction: "nbn" }, numSwissPlayers: 2, numCutPlayers: 1, cutConversion: 50.0 },
        { identity: { name: "A Teia: IP Recovery", faction: "jinteki" }, numSwissPlayers: 1, numCutPlayers: 0, cutConversion: 0.0 },
      ],
      factions: [
        { name: "haas-bioroid", numSwissPlayers: 2, numCutPlayers: 2, cutConversion: 100.0 },
        { name: "nbn", numSwissPlayers: 2, numCutPlayers: 1, cutConversion: 50.0 },
        { name: "jinteki", numSwissPlayers: 1, numCutPlayers: 0, cutConversion: 0.0 },
      ],
    },
    runner: {
      ids: [
        { identity: { name: "Esâ Afontov: Eco-Insurrectionist", faction: "anarch" }, numSwissPlayers: 2, numCutPlayers: 2, cutConversion: 100.0 },
        { identity: { name: "Dewi Subrotoputri: Pedagogical Dhalang", faction: "shaper" }, numSwissPlayers: 1, numCutPlayers: 1, cutConversion: 100.0 },
        { identity: { name: "Barry “Baz” Wong: Tri-Maf Veteran", faction: "criminal" }, numSwissPlayers: 2, numCutPlayers: 0, cutConversion: 0.0 },
      ],
      factions: [
        { name: "anarch", numSwissPlayers: 2, numCutPlayers: 2, cutConversion: 100.0 },
        { name: "shaper", numSwissPlayers: 1, numCutPlayers: 1, cutConversion: 100.0 },
        { name: "criminal", numSwissPlayers: 2, numCutPlayers: 0, cutConversion: 0.0 },
      ],
    },
  };

  function renderStatsPage(data: {
    stages: Stage[];
    stats: Stats;
    cutStats: CutStats | null;
  }) {
    return render(StatsPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
        params: { tournamentId: "1" },
      },
    });
  }

  it("renders 'No stats available' when tournament has no rounds played", () => {
    const unstartedStage: Stage = {
      ...mockSwissStage,
      rounds: [],
    };

    renderStatsPage({
      stages: [unstartedStage],
      stats: mockStats,
      cutStats: null,
    });

    expect(screen.getByRole("heading", { level: 2, name: "Stats" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "No stats available" })).toBeDefined();
    expect(
      screen.getByText(/This tournament has no rounds yet/i),
    ).toBeDefined();
  });

  it("renders Swiss round faction charts and ID tables when rounds exist", () => {
    const { container } = renderStatsPage({
      stages: [mockSwissStage],
      stats: mockStats,
      cutStats: null,
    });

    expect(screen.getByRole("heading", { level: 3, name: "Swiss Rounds" })).toBeDefined();

    // Chart containers exist
    expect(container.querySelector("#swiss-corp-faction-chart")).not.toBeNull();
    expect(container.querySelector("#swiss-runner-faction-chart")).not.toBeNull();

    // Swiss Corp table contents
    const corpTable = container.querySelector("#swiss-corp-table");
    expect(corpTable).not.toBeNull();
    expect(corpTable?.textContent).toContain("Editorial Division: Ad Nihilum");
    expect(corpTable?.textContent).toContain("2 (40.0%)");
    expect(corpTable?.textContent).toContain("A Teia: IP Recovery");
    expect(corpTable?.textContent).toContain("1 (20.0%)");

    // Swiss Runner table contents
    const runnerTable = container.querySelector("#swiss-runner-table");
    expect(runnerTable).not.toBeNull();
    expect(runnerTable?.textContent).toContain("Barry “Baz” Wong: Tri-Maf Veteran");
    expect(runnerTable?.textContent).toContain("2 (40.0%)");
    expect(runnerTable?.textContent).toContain("Dewi Subrotoputri: Pedagogical Dhalang");
    expect(runnerTable?.textContent).toContain("1 (20.0%)");

    // No elimination stage message
    expect(screen.getByRole("heading", { level: 3, name: "No elimination stage" })).toBeDefined();
  });

  it("renders Elimination rounds faction charts and ID tables when elimination stage exists", () => {
    const { container } = renderStatsPage({
      stages: [mockSwissStage, mockElimStage],
      stats: mockStats,
      cutStats: null,
    });

    expect(screen.getByRole("heading", { level: 3, name: "Elimination Rounds" })).toBeDefined();

    // Elim chart containers exist
    expect(container.querySelector("#elim-corp-faction-chart")).not.toBeNull();
    expect(container.querySelector("#elim-runner-faction-chart")).not.toBeNull();

    // Elim Corp table contents
    const elimCorpTable = container.querySelector("#elim-corp-table");
    expect(elimCorpTable).not.toBeNull();
    expect(elimCorpTable?.textContent).toContain("Editorial Division: Ad Nihilum");
    expect(elimCorpTable?.textContent).toContain("1 (33.3%)");

    // Elim Runner table contents
    const elimRunnerTable = container.querySelector("#elim-runner-table");
    expect(elimRunnerTable).not.toBeNull();
    expect(elimRunnerTable?.textContent).toContain("Esâ Afontov: Eco-Insurrectionist");
    expect(elimRunnerTable?.textContent).toContain("2 (66.7%)");
  });

  it("renders Cut Conversion Rate faction and ID tables when cutStats is provided", () => {
    const { container } = renderStatsPage({
      stages: [mockSwissStage, mockElimStage],
      stats: mockStats,
      cutStats: mockCutStats,
    });

    expect(
      screen.getByRole("heading", { level: 3, name: "Elimination Cut Conversion Rates" }),
    ).toBeDefined();

    // Corp Faction Cut Conversion table
    const corpFactionTable = container.querySelector("#cut-corp-faction-table");
    expect(corpFactionTable).not.toBeNull();
    expect(corpFactionTable?.textContent).toContain("Haas-Bioroid");
    expect(corpFactionTable?.textContent).toContain("2 / 2 (100.0%)");
    expect(corpFactionTable?.textContent).toContain("NBN");
    expect(corpFactionTable?.textContent).toContain("1 / 2 (50.0%)");
    expect(corpFactionTable?.textContent).toContain("Jinteki");
    expect(corpFactionTable?.textContent).toContain("0 / 1 (0.0%)");

    // Runner Faction Cut Conversion table
    const runnerFactionTable = container.querySelector("#cut-runner-faction-table");
    expect(runnerFactionTable).not.toBeNull();
    expect(runnerFactionTable?.textContent).toContain("Anarch");
    expect(runnerFactionTable?.textContent).toContain("2 / 2 (100.0%)");
    expect(runnerFactionTable?.textContent).toContain("Criminal");
    expect(runnerFactionTable?.textContent).toContain("0 / 2 (0.0%)");

    // Corp ID Cut Conversion table
    const corpIdTable = container.querySelector("#cut-corp-id-table");
    expect(corpIdTable).not.toBeNull();
    expect(corpIdTable?.textContent).toContain("MirrorMorph: Endless Iteration");
    expect(corpIdTable?.textContent).toContain("1 / 1 (100.0%)");
    expect(corpIdTable?.textContent).toContain("Editorial Division: Ad Nihilum");
    expect(corpIdTable?.textContent).toContain("1 / 2 (50.0%)");

    // Runner ID Cut Conversion table
    const runnerIdTable = container.querySelector("#cut-runner-id-table");
    expect(runnerIdTable).not.toBeNull();
    expect(runnerIdTable?.textContent).toContain("Esâ Afontov: Eco-Insurrectionist");
    expect(runnerIdTable?.textContent).toContain("2 / 2 (100.0%)");
    expect(runnerIdTable?.textContent).toContain("Barry “Baz” Wong: Tri-Maf Veteran");
    expect(runnerIdTable?.textContent).toContain("0 / 2 (0.0%)");
  });
});
