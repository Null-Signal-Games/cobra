import { describe, it, expect } from "vitest";
import { CreateMyTournamentSummary } from "./transformations";
import type { PairingsData } from "../../routes/tournaments/[tournamentId]/api_helper";
import type { Player } from "$lib/model/Player";
import type { Round } from "$lib/model/Round";

const createPlayer = (overrides: Partial<Player>): Player => ({
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
  ...overrides
} as Player);

const createRound = (overrides: Partial<Round>): Round => ({
  id: 1,
  number: 1,
  completed: true,
  pairings: [],
  pairings_reported: 1,
  length_minutes: 0,
  timer: {} as never,
  unpaired_players: [],
  ...overrides
});

const alice = createPlayer({
  id: 1,
  user_id: 1,
  name: "Alice",
  name_with_pronouns: "Alice",
  corp_id: { name: "Corp" } as never,
  runner_id: { name: "Runner" } as never
});

const bob = createPlayer({
  id: 2,
  user_id: 2,
  name: "Bob",
  name_with_pronouns: "Bob"
});

const bye = createPlayer({
  id: 0,
  user_id: 0,
  name: "Bye",
  name_with_pronouns: "Bye"
});

describe("transformations", () => {
  describe("CreateMyTournamentSummary", () => {
    it("handles undefined data", () => {
      const summary = CreateMyTournamentSummary(undefined, 1);
      expect(summary.total.wins).toBe(0);
      expect(summary.pairings.length).toBe(0);
    });

    it("handles null data", () => {
      const summary = CreateMyTournamentSummary(null, 1);
      expect(summary.total.wins).toBe(0);
      expect(summary.pairings.length).toBe(0);
    });

    it("handles missing userId", () => {
      const summary = CreateMyTournamentSummary(null, undefined);
      expect(summary.total.wins).toBe(0);
      expect(summary.pairings.length).toBe(0);
    });

    it("processes a bye correctly", () => {
      const data: PairingsData = {
        // tournament: {} as never,
        policy: { update: false, custom_table_numbering: false },
        stages: [{
          id: 1, name: "Swiss", format: "swiss", is_single_sided: true, is_elimination: false, view_decks: false,
          rounds: [
            createRound({
              pairings: [{
                id: 10, table_number: 1, table_label: "1", policy: { self_report: false },
                reported: true, intentional_draw: false, two_for_one: false, self_reports: null, winner_game: null, loser_game: null, bracket_type: null, ui_metadata: { row_highlighted: false },
                score1: 3, score2: 0, score1_corp: 0, score1_runner: 0, score2_corp: 0, score2_runner: 0, score_label: "Bye",
                player1: alice,
                player2: bye
              }]
            })
          ]
        }]
      };

      const summary = CreateMyTournamentSummary(data, 1);
      expect(summary.total.wins).toBe(1);
      expect(summary.total.points).toBe(3);
      expect(summary.pairings[0].cumulativePoints).toBe(3);
    });

    it("processes a normal round win, loss, and tie, checking cumulative points", () => {
      const createPairing = (id: number, score1: number, score2: number, corp1: number, run1: number, reported = true) => ({
        id, table_number: 1, table_label: "1", policy: { self_report: false },
        reported, intentional_draw: false, two_for_one: false, self_reports: null, winner_game: null, loser_game: null, bracket_type: null, ui_metadata: { row_highlighted: false },
        score1, score2, score1_corp: corp1, score1_runner: run1, score2_corp: 0, score2_runner: 0, score_label: "Done",
        player1: alice,
        player2: bob
      });

      const data: PairingsData = {
        // tournament: {} as never,
        policy: { update: false, custom_table_numbering: false },
        stages: [{
          id: 1, name: "Swiss", format: "swiss", is_single_sided: true, is_elimination: false, view_decks: false,
          rounds: [
            createRound({ id: 1, number: 1, pairings: [createPairing(101, 3, 0, 3, 0)] }),
            createRound({ id: 2, number: 2, pairings: [createPairing(102, 0, 3, 0, 0)] }),
            createRound({ id: 3, number: 3, pairings: [createPairing(103, 1, 1, 0, 0)] })
          ]
        }]
      };

      const summary = CreateMyTournamentSummary(data, 1);

      expect(summary.total.wins).toBe(1);
      expect(summary.total.losses).toBe(1);
      expect(summary.total.ties).toBe(1);
      expect(summary.total.points).toBe(4); // 3 + 0 + 1

      expect(summary.corpIdentity?.name).toBe("Corp");
      expect(summary.runnerIdentity?.name).toBe("Runner");

      // Cumulative points check
      expect(summary.pairings[0].cumulativePoints).toBe(3);
      expect(summary.pairings[1].cumulativePoints).toBe(3); // 3 + 0
      expect(summary.pairings[2].cumulativePoints).toBe(4); // 3 + 0 + 1
    });
  });
});
