import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStats } from "../pairings/PairingsData";
import { MockCutStats, MockStats } from "./StatsTestData";
import Stats from "../tournaments/Stats.svelte";
import { getByText, render } from "@testing-library/svelte";
import {
  MockPairingsData,
  MockSingleElimCutStage,
  MockSwissStage,
} from "./RoundsTestData";
import { tick } from "svelte";

vi.mock("../pairings/PairingsData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadPairings: vi.fn(() => MockPairingsData),
  loadStats: vi.fn(() => MockStats),
  loadCutStats: vi.fn(() => MockCutStats),
}));

// These stubs allow us to test ApexCharts
// (from https://github.com/apexcharts/react-apexcharts/issues/425#issuecomment-2066446183)
const ResizeObserver = vi.fn(function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});

Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get() {
    return 500;
  },
});
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  get() {
    return 300;
  },
});
Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  get() {
    return 500;
  },
});
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get() {
    return 300;
  },
});



Object.assign(window.SVGElement.prototype, {
  getScreenCTM: vi.fn(() => ({
    x: 10,
    y: 10,
    inverse: vi.fn(),
    multiply: vi.fn(),
  })),
  getBBox: vi.fn(() => ({
    x: 10,
    y: 10,
    width: 100,
    height: 100,
  })),
  getComputedTextLength: vi.fn(() => 10),
  createSVGMatrix: vi.fn(() => ({
    x: 10,
    y: 10,
    inverse: vi.fn(),
    multiply: vi.fn(),
  })),
});
vi.stubGlobal("ResizeObserver", ResizeObserver);

describe("Stats", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    vi.spyOn(MockPairingsData, "stages", "get").mockReturnValue([
      MockSwissStage,
      MockSingleElimCutStage,
    ]);

    render(Stats, { tournamentId: 1 });
    await tick();
  });

  describe.each([
    [
      "Swiss corp faction chart",
      "swiss-corp-faction-chart",
      ["Haas-Bioroid", "Jinteki", "NBN"],
    ],
    [
      "Swiss runner faction chart",
      "swiss-runner-faction-chart",
      ["Anarch", "Criminal", "Shaper"],
    ],
    [
      "elim corp faction chart",
      "elim-corp-faction-chart",
      ["Haas-Bioroid", "NBN"],
    ],
    [
      "elim runner faction chart",
      "elim-runner-faction-chart",
      ["Anarch", "Shaper"],
    ],
  ])("faction charts", (testName, divId, factions) => {
    it(testName, async () => {
      await new Promise((r) => setTimeout(r, 0));
      const chartDiv = document.getElementById(divId);
      expect(chartDiv).not.toBeNull();
      if (!chartDiv) {
        return;
      }

      const pieSeries = chartDiv.getElementsByClassName(
        "apexcharts-pie-series",
      );
      expect(pieSeries).not.toBeNull();
      expect(pieSeries.length).toBe(factions.length);
      for (const series of pieSeries) {
        const seriesName = series.getAttribute("seriesName");
        expect(seriesName).not.toBeNull();
        if (!seriesName) {
          return;
        }

        expect(factions.indexOf(seriesName)).not.toBe(-1);
      }
    });
  });

  describe.each([
    [
      "Swiss corp ID table",
      "swiss-corp-table",
      [
        ["Editorial Division: Ad Nihilum", "2 (40.0%)"],
        ["A Teia: IP Recovery", "1 (20.0%)"],
        ["MirrorMorph: Endless Iteration", "1 (20.0%)"],
        ["Thunderbolt Armaments: Peace Through Power", "1 (20.0%)"],
      ],
    ],
    [
      "Swiss runner ID table",
      "swiss-runner-table",
      [
        ["Barry “Baz” Wong: Tri-Maf Veteran", "2 (40.0%)"],
        ["Esâ Afontov: Eco-Insurrectionist", "2 (40.0%)"],
        ["Dewi Subrotoputri: Pedagogical Dhalang", "1 (20.0%)"],
      ],
    ],
    [
      "elim corp ID table",
      "elim-corp-table",
      [
        ["Editorial Division: Ad Nihilum", "1 (33.3%)"],
        ["MirrorMorph: Endless Iteration", "1 (33.3%)"],
        ["Thunderbolt Armaments: Peace Through Power", "1 (33.3%)"],
      ],
    ],
    [
      "elim runner ID table",
      "elim-runner-table",
      [
        ["Esâ Afontov: Eco-Insurrectionist", "2 (66.7%)"],
        ["Dewi Subrotoputri: Pedagogical Dhalang", "1 (33.3%)"],
      ],
    ],
    [
      "corp faction cut conversion table",
      "cut-corp-faction-table",
      [
        ["Haas-Bioroid", "2 / 2 (100.0%)"],
        ["NBN", "1 / 2 (50.0%)"],
        ["Jinteki", "0 / 1 (0.0%)"],
      ],
    ],
    [
      "runner faction cut conversion table",
      "cut-runner-faction-table",
      [
        ["Anarch", "2 / 2 (100.0%)"],
        ["Shaper", "1 / 1 (100.0%)"],
        ["Criminal", "0 / 2 (0.0%)"],
      ],
    ],
    [
      "corp ID cut conversion table",
      "cut-corp-id-table",
      [
        ["MirrorMorph: Endless Iteration", "1 / 1 (100.0%)"],
        ["Thunderbolt Armaments: Peace Through Power", "1 / 1 (100.0%)"],
        ["Editorial Division: Ad Nihilum", "1 / 2 (50.0%)"],
        ["A Teia: IP Recovery", "0 / 1 (0.0%)"],
      ],
    ],
    [
      "runner ID cut conversion table",
      "cut-runner-id-table",
      [
        ["Esâ Afontov: Eco-Insurrectionist", "2 / 2 (100.0%)"],
        ["Dewi Subrotoputri: Pedagogical Dhalang", "1 / 1 (100.0%)"],
        ["Barry “Baz” Wong: Tri-Maf Veteran", "0 / 2 (0.0%)"],
      ],
    ],
  ])("stats tables", (testName, tableId, ids) => {
    it(testName, () => {
      const table = document.getElementById(tableId);
      expect(table).not.toBeNull();
      if (!table) {
        return;
      }

      expect(loadStats).toHaveBeenCalledOnce();
      const tableRows = table
        .getElementsByTagName("tbody")[0]
        .getElementsByTagName("tr");
      expect(tableRows.length).toBe(ids.length);
      for (let i = 0; i < ids.length; i++) {
        expect(getByText(tableRows[i], ids[i][0])).toBeInTheDocument();
        expect(getByText(tableRows[i], ids[i][1])).toBeInTheDocument();
      }
    });
  });
});
