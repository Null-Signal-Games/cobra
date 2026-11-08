import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import MePage from "./+page.svelte";
import { Tournament } from "#lib/model/Tournament.ts";
import type { PairingsData } from "#lib/api/betaTypes.ts";
import type { Pairing } from "#lib/model/Pairing.ts";
import type { Player } from "#lib/model/Player.ts";

vi.mock("$app/env/public", () => ({
  CLIENT_COBRA_API_ENDPOINT: "http://localhost:3000",
}));

const createPlayer = (overrides: Partial<Player>): Player =>
  ({
    side: null,
    corp_id: {} as never,
    runner_id: {} as never,
    pronouns: "",
    side_label: null,
    registration_locked: false,
    include_in_stream: false,
    active: true,
    first_round_bye: false,
    manual_seed: null,
    fixed_table_number: null,
    ...overrides,
  }) as Player;

const me = createPlayer({ id: 1, user_id: 1, name: "evie", name_with_pronouns: "evie" });
const opponent = createPlayer({ id: 2, user_id: 2, name: "locks", name_with_pronouns: "locks" });

function createPairing(overrides: Partial<Pairing>): Pairing {
  return {
    id: 10,
    table_number: 1,
    table_label: "Table 1",
    policy: { self_report: false },
    player1: me,
    player2: opponent,
    score1: 0,
    score1_corp: 0,
    score1_runner: 0,
    score2: 0,
    score2_corp: 0,
    score2_runner: 0,
    score_label: "-",
    intentional_draw: false,
    two_for_one: false,
    self_reports: null,
    reported: false,
    winner_game: null,
    loser_game: null,
    bracket_type: null,
    ui_metadata: { row_highlighted: true },
    ...overrides,
  };
}

function renderMePage(pairing: Pairing) {
  const pairings: PairingsData = {
    policy: { update: false, custom_table_numbering: false },
    stages: [
      {
        id: 1,
        name: "Swiss",
        format: "swiss",
        is_single_sided: false,
        is_elimination: false,
        view_decks: false,
        rounds: [
          {
            id: 1,
            number: 1,
            completed: true,
            pairings: [pairing],
            pairings_reported: pairing.reported ? 1 : 0,
            length_minutes: 65,
            timer: {} as never,
            unpaired_players: [],
            weight: 0,
          },
        ],
      },
    ],
  };

  return render(MePage, {
    props: {
      data: {
        user: { id: 1 },
        player: me,
        tournamentData: { tournament: new Tournament({ id: 1, swiss_format: "double_sided" }) },
        pairings,
      } as never,
      params: { tournamentId: "1" } as never,
    },
  });
}

describe("Me page results column", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the result of a manually entered 0-0 instead of the self report", () => {
    renderMePage(
      createPairing({
        reported: true,
        score_label: "0 - 0",
        self_reports: [
          {
            score1: 6,
            score2: 0,
            score1_corp: 3,
            score1_runner: 3,
            score2_corp: 0,
            score2_runner: 0,
            intentional_draw: false,
            label: "6 - 0",
          },
        ],
      }),
    );

    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.queryByText(/Report:/)).not.toBeInTheDocument();
  });

  it("shows the self report for an unreported pairing", () => {
    renderMePage(
      createPairing({
        reported: false,
        self_reports: [
          {
            score1: 6,
            score2: 0,
            score1_corp: 3,
            score1_runner: 3,
            score2_corp: 0,
            score2_runner: 0,
            intentional_draw: false,
            label: "6 - 0",
          },
        ],
      }),
    );

    expect(screen.getByText(/Report: 6 - 0/)).toBeInTheDocument();
  });

  it("shows a win for a reported win", () => {
    renderMePage(createPairing({ reported: true, score1: 6, score2: 0, score_label: "6 - 0" }));

    expect(screen.getByText("W")).toBeInTheDocument();
  });
});
