import { Identity } from "$lib/model/Identity";
import type { Pairing } from "$lib/model/Pairing";
import type { Player } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { ScoreReport } from "$lib/model/ScoreReport";
import { Tournament } from "$lib/model/Tournament";
import type { RoundData } from "../../../api_helper";

export const MockPlayerAlice: Player = {
  id: 1,
  name: "Alice",
  name_with_pronouns: "",
  side: "corp",
  user_id: 1,
  side_label: null,
  corp_id: new Identity(),
  runner_id: new Identity(),
  include_in_stream: false,
  active: null,
  pronouns: "",
  registration_locked: false,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

export const MockPlayerBob: Player = {
  id: 2,
  name: "Bob",
  name_with_pronouns: "",
  side: "runner",
  user_id: 2,
  side_label: null,
  corp_id: new Identity(),
  runner_id: new Identity(),
  include_in_stream: false,
  active: null,
  pronouns: "",
  registration_locked: false,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

export const MockSelfReport1: ScoreReport = {
  report_player_id: MockPlayerAlice.user_id,
  score1: 6,
  score2: 0,
  intentional_draw: false,
  score1_corp: 3,
  score2_corp: null,
  score1_runner: 3,
  score2_runner: null,
};

export const MockSelfReport2: ScoreReport = {
  report_player_id: MockPlayerBob.user_id,
  score1: 6,
  score2: 0,
  intentional_draw: false,
  score1_corp: 3,
  score2_corp: null,
  score1_runner: 3,
  score2_runner: null,
};

export const Pairing1: Pairing = {
  id: 1,
  table_number: 1,
  table_label: "Table 1",
  policy: {
    self_report: false,
  },
  player1: MockPlayerAlice,
  player2: MockPlayerBob,
  score1: 0,
  score1_corp: 0,
  score1_runner: 0,
  score2: 0,
  score2_corp: 0,
  score2_runner: 0,
  score_label: "",
  intentional_draw: false,
  two_for_one: false,
  self_reports: [MockSelfReport1, MockSelfReport2],
  reported: false,
  winner_game: null,
  loser_game: null,
  bracket_type: null,
  ui_metadata: {
    row_highlighted: false,
  },
};

export const MockRound1Timer: RoundTimer = {
  running: false,
  paused: false,
  started: false,
  show: false,
  state: {
    started: false,
    paused: false,
    finish_time: undefined,
    remaining_seconds: undefined,
    length_minutes: undefined
  }
};

export const MockRoundData: RoundData = {
  tournament: new Tournament(),
  policy: { update: true, custom_table_numbering: false },
  stage: {
    id: 1,
    name: "Single Sided Swiss",
    format: "single_sided_swiss",
    is_single_sided: true,
    is_elimination: false,
    view_decks: false,
    rounds: [],
  },
  round: {
    id: 1,
    number: 1,
    completed: false,
    weight: 1.0,
    pairings: [Pairing1],
    pairings_reported: 0,
    length_minutes: 0,
    timer: {
      running: false,
      paused: false,
      started: false,
      show: false,
      state: {
        started: false,
        paused: false,
        finish_time: undefined,
        remaining_seconds: undefined,
        length_minutes: undefined
      }
    },
    unpaired_players: [],
  },
};
